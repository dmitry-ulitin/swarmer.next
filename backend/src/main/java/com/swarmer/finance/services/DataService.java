package com.swarmer.finance.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.dto.DumpGroup;
import com.swarmer.finance.dto.DumpCategory;
import com.swarmer.finance.dto.DumpTransaction;
import com.swarmer.finance.models.Acl;
import com.swarmer.finance.models.Category;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;
import com.swarmer.finance.repositories.AclRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class DataService {
    private final AclRepository aclRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public DataService(AclRepository aclRepository, UserRepository userRepository, GroupRepository groupRepository,
            CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.aclRepository = aclRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public Dump getDump(Long userId) {
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdInOrderById(List.of(userId)).stream()
                .filter(c -> c.getOwnerId() != null).map(DumpCategory::from).toList();
        var groups = groupRepository.findByOwnerIdInOrderById(List.of(userId)).stream().map(DumpGroup::from).toList();
        var transactions = transactionRepository.findAllByOwnerId(userId).map(DumpTransaction::from).toList();
        return new Dump(userId, LocalDateTime.now(), groups, categories, transactions);
    }

    public void loadDump(Long userId, Dump dump) {
        // categories
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdInOrderById(List.of(userId)).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        for (var category : dump.categories()) {
            var existingCategory = categories.get(category.id());
            if (existingCategory == null) {
                categoryRepository.insertCategoryWithId(category.id(), userId, category.parentId(), category.name(),
                        category.created(), category.updated());
                existingCategory = categoryRepository.findById(category.id()).orElseThrow();
                categories.put(category.id(), existingCategory);
            }
        }
        for (var category : dump.categories()) {
            var existingCategory = categories.get(category.id());
            if (existingCategory != null && !category.updated().isEqual(existingCategory.getUpdated())) {
                existingCategory.setName(category.name());
                if (!existingCategory.getParentId().equals(category.parentId())) {
                    existingCategory.setParentId(category.parentId());
                    existingCategory.setParent(categoryRepository.findById(category.parentId()).orElseThrow());
                }
                existingCategory.setUpdated(category.updated());
                categoryRepository.save(existingCategory);
            }
        }
        // groups
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
                        .forEach(a -> aclRepository.deleteByUserIdAndGroupId(a.getUserId(), a.getGroupId()));
                group.setAcls(group.getAcls().stream().filter(
                        a -> updated.acls().stream().anyMatch(p -> p.userId().equals(a.getUserId())))
                        .collect(Collectors.toList()));
                groupRepository.save(group);
            }
        }
        // transactions
        transactionRepository.removeByOwnerId(userId);
        for (var t : dump.transactions()) {
            transactionRepository.insertTransactionWithId(t.id(), userId, t.opdate(), t.accountId(), t.debit(),
                    t.recipientId(), t.credit(), t.categoryId(), t.currency(), t.party(), t.details(), t.created(),
                    t.updated());
        }
    }
}
