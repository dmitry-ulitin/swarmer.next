package com.swarmer.finance.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.dto.DumpGroup;
import com.swarmer.finance.dto.DumpRule;
import com.swarmer.finance.dto.DumpCategory;
import com.swarmer.finance.dto.DumpTransaction;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.Acl;
import com.swarmer.finance.models.Category;
import com.swarmer.finance.models.Rule;
import com.swarmer.finance.models.Transaction;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.RuleRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;
import com.swarmer.finance.repositories.AccountRepository;
import com.swarmer.finance.repositories.AclRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class DataService {
    private final AclRepository aclRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final RuleRepository ruleRepository;

    public DataService(AclRepository aclRepository, UserRepository userRepository, GroupRepository groupRepository,
            AccountRepository accountRepository, CategoryRepository categoryRepository,
            TransactionRepository transactionRepository, RuleRepository ruleRepository) {
        this.aclRepository = aclRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.ruleRepository = ruleRepository;
    }

    public Dump getDump(Long userId) {
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdIn(List.of(userId)).stream()
                .sorted((c1, c2) -> (int) (c1.getLevel() - c2.getLevel()))
                .filter(c -> c.getOwnerId() != null).map(DumpCategory::from).toList();
        var groups = groupRepository.findByOwnerIdInOrderById(List.of(userId)).stream().map(DumpGroup::from).toList();
        var transactions = transactionRepository.findAllByOwnerId(userId).map(DumpTransaction::from).toList();
        var rules = ruleRepository.findAllByOwnerId(userId).stream().map(DumpRule::from).toList();
        return new Dump(userId, LocalDateTime.now(), groups, categories, transactions, rules);
    }

    public void loadDump(Long userId, Dump dump) {
        var owner = userRepository.findById(userId).orElseThrow();
        // remove old data
        transactionRepository.removeByOwnerId(userId);
        ruleRepository.removeByOwnerId(userId);
        categoryRepository.removeByOwnerId(userId);
        groupRepository.deleteByOwnerId(userId);
        // groups
        var accMap = new HashMap<Long, Long>();
        if (dump.ownerId().equals(userId)) {
            // update existing groups
            var groups = groupRepository.findByOwnerIdInOrderById(List.of(userId));
            for (var group : groups) {
                var updated = dump.groups().stream().filter(g -> g.id().equals(group.getId())).findFirst().orElse(null);
                if (updated == null) {
                    group.setDeleted(true);
                    groupRepository.save(group);
                } else {
                    group.setName(updated.name());
                    group.setDeleted(updated.deleted());
                    group.setUpdated(updated.updated());
                    for (var account : group.getAccounts()) {
                        var updatedAccount = updated.accounts().stream().filter(a -> a.id().equals(account.getId()))
                                .findFirst().orElse(null);
                        if (updatedAccount == null) {
                            account.setDeleted(true);
                        } else {
                            account.setName(updatedAccount.name());
                            account.setCurrency(updatedAccount.currency());
                            account.setStart_balance(updatedAccount.start_balance());
                            account.setDeleted(updatedAccount.deleted());
                            account.setUpdated(updatedAccount.updated());
                        }
                    }
                    // save permissions
                    for (var updatedAcl : updated.acls()) {
                        var acl = group.getAcls().stream().filter(a -> a.getUserId().equals(updatedAcl.userId()))
                                .findFirst()
                                .orElse(null);
                        if (acl == null) {
                            var user = userRepository.findById(updatedAcl.userId()).orElseThrow();
                            group.getAcls()
                                    .add(new Acl(group.getId(), group, updatedAcl.userId(), user, updatedAcl.admin(),
                                            updatedAcl.readonly(), updatedAcl.name(),
                                            updatedAcl.deleted(), updatedAcl.created(), updatedAcl.updated()));
                        } else {
                            acl.setAdmin(updatedAcl.admin());
                            acl.setReadonly(updatedAcl.readonly());
                            acl.setUpdated(updatedAcl.updated());
                        }
                    }
                    group.getAcls().stream().filter(
                            a -> updated.acls().stream().noneMatch(p -> p.userId().equals(a.getUserId())))
                            .forEach(a -> aclRepository.delete(a));
                    group.setAcls(group.getAcls().stream().filter(
                            a -> updated.acls().stream().anyMatch(p -> p.userId().equals(a.getUserId())))
                            .collect(Collectors.toList()));
                    groupRepository.save(group);
                }
            }
        }
        // insert new groups
        for (var g : dump.groups()) {
            var existingGroup = dump.ownerId().equals(userId) ? groupRepository.findById(g.id()).orElse(null) : null;
            if (existingGroup == null || !existingGroup.getOwner().getId().equals(userId)) {
                var group = new AccountGroup();
                group.setOwner(owner);
                group.setName(g.name());
                group.setDeleted(g.deleted());
                group.setCreated(g.created());
                group.setUpdated(g.updated());
                group.setAccounts(List.of());
                group.setAcls(List.of());
                groupRepository.save(group);
                for (var a : g.accounts()) {
                    var account = new Account(null, group, a.name(), a.currency(), a.start_balance(), a.deleted(),
                            a.created(), a.updated());
                    accountRepository.save(account);
                    accMap.put(a.id(), account.getId());
                }
                for (var acl : g.acls()) {
                    var user = userRepository.findById(acl.userId()).orElseThrow();
                    var a = new Acl(group.getId(), group, acl.userId(), user, acl.admin(), acl.readonly(),
                            acl.name(),
                            acl.deleted(), acl.created(), acl.updated());
                    aclRepository.save(a);
                }
            }
        }
        // categories
        var catMap = new HashMap<Long, Long>();
        for (var c : dump.categories()) {
            var existingCategory = dump.ownerId().equals(userId) ? categoryRepository.findById(c.id()).orElse(null)
                    : null;
            var parentId = catMap.getOrDefault(c.parentId(), c.parentId());
            if (existingCategory == null) {
                categoryRepository.insertCategoryWithId(c.id(), userId, parentId, c.name(), c.created(), c.updated());
            } else {
                var parent = categoryRepository.findById(parentId).orElse(null);
                var category = new Category(null, userId, parentId, parent, c.name(), c.created(), c.updated());
                categoryRepository.save(category);
                catMap.put(c.id(), category.getId());
            }
        }
        // transactions
        for (var t : dump.transactions()) {
            var existingTransaction = dump.ownerId().equals(userId)
                    ? transactionRepository.findById(t.id()).orElse(null)
                    : null;
            if (existingTransaction == null) {
                transactionRepository.insertTransactionWithId(t.id(), userId, t.opdate(),
                        accMap.getOrDefault(t.accountId(), t.accountId()), t.debit(),
                        accMap.getOrDefault(t.recipientId(), t.recipientId()), t.credit(),
                        catMap.getOrDefault(t.categoryId(), t.categoryId()), t.currency(),
                        t.party(), t.details(), t.created(), t.updated());
            } else {
                var account = t.accountId() == null ? null
                        : accountRepository.findById(accMap.getOrDefault(t.accountId(), t.accountId())).orElse(null);
                var recipient = t.recipientId() == null ? null
                        : accountRepository.findById(accMap.getOrDefault(t.recipientId(), t.recipientId()))
                                .orElse(null);
                var category = t.categoryId() == null ? null
                        : categoryRepository.findById(catMap.getOrDefault(t.categoryId(), t.categoryId())).orElse(null);
                transactionRepository.save(new Transaction(null, owner, t.opdate(), account, t.debit(),
                        recipient, t.credit(), category, t.currency(), t.party(), t.details(), t.created(),
                        t.updated()));
            }
        }
        // rules
        for (var r : dump.rules()) {
            var existingRule = dump.ownerId().equals(userId) ? ruleRepository.findById(r.id()).orElse(null) : null;
            if (existingRule == null) {
                ruleRepository.insertRuleWithId(r.id(), userId, r.conditionType().getValue(), r.conditionValue(),
                        r.categoryId(),
                        r.created(), r.updated());
            } else {
                var category = r.categoryId() == null ? null
                        : categoryRepository.findById(catMap.getOrDefault(r.categoryId(), r.categoryId())).orElse(null);
                ruleRepository.save(
                        new Rule(null, userId, r.conditionType(), r.conditionValue(), category, r.created(),
                                r.updated()));
            }
        }
    }
}
