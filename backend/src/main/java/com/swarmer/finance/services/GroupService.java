package com.swarmer.finance.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.GroupDto;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.Acl;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.UserRepository;

@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;
    private final AclService aclService;

    public GroupService(GroupRepository groupRepository, UserRepository userRepository,
            TransactionService transactionService,
            AclService aclService) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.transactionService = transactionService;
        this.aclService = aclService;
    }

    public List<GroupDto> getGroups(Long userId, LocalDateTime opdate) {
        var aids = aclService.findAccounts(userId).map(a -> a.getId()).toList();
        var amounts = transactionService.getBalances(aids, null, opdate, null);
        var balances = aids.stream().collect(Collectors.toMap(id -> id, id -> {
            Double balance = .0;
            balance -= amounts.stream().filter(b -> id.equals(b.getAccountId())).mapToDouble(a -> a.getDebit()).sum();
            balance += amounts.stream().filter(b -> id.equals(b.getRecipientId())).mapToDouble(a -> a.getCredit())
                    .sum();
            return balance;
        }));

        var userGroups = groupRepository.findByOwnerIdInOrderById(List.of(userId)).stream()
                .map(g -> GroupDto.from(g, userId, balances))
                .sorted((a, b) -> a.id().compareTo(b.id()))
                .toList();
        var sharedGroups = aclService.findByUserId(userId)
                .map(a -> GroupDto.from(a.getGroup(), userId, balances))
                .sorted((a, b) -> a.id().compareTo(b.id()))
                .collect(Collectors.toList());

        var allGroups = userGroups.stream().filter(GroupDto::owner).collect(Collectors.toList());

        allGroups.addAll(userGroups.stream().filter(GroupDto::coowner).toList());
        allGroups.addAll(sharedGroups.stream().filter(GroupDto::coowner).toList());
        allGroups.addAll(sharedGroups.stream().filter(GroupDto::shared).toList());

        return allGroups;
    }

    public GroupDto getGroup(Long groupId, Long userId) {
        var group = groupRepository.findById(groupId).orElseThrow();
        var aids = group.getAccounts().stream().map(a -> a.getId()).toList();
        var amounts = transactionService.getBalances(aids);
        var balances = aids.stream().collect(Collectors.toMap(id -> id, id -> {
            Double balance = .0;
            balance -= amounts.stream().filter(b -> id.equals(b.getAccountId())).mapToDouble(a -> a.getDebit()).sum();
            balance += amounts.stream().filter(b -> id.equals(b.getRecipientId())).mapToDouble(a -> a.getCredit())
                    .sum();
            return balance;
        }));
        return GroupDto.from(group, userId, balances);
    }

    public GroupDto createGroup(GroupDto dto, Long userId) {
        var entity = new AccountGroup();
        entity.setOwner(userRepository.findById(userId).orElseThrow());
        entity.setName(dto.fullname());
        entity.setDeleted(false);
        entity.setCreated(LocalDateTime.now());
        entity.setUpdated(LocalDateTime.now());
        var accounts = dto.accounts().stream().filter(account -> (account.deleted() == null || !account.deleted()))
                .map(account -> new Account(null, entity, account.name(), account.currency(),
                        account.startBalance() == null ? .0 : account.startBalance(), false,
                        LocalDateTime.now(), LocalDateTime.now()))
                .toList();
        entity.setAccounts(accounts);
        entity.setAcls(List.of());
        groupRepository.save(entity);
        if (!dto.permissions().isEmpty()) {
            var acls = dto.permissions().stream().map(p -> {
                var user = userRepository.findByEmail(p.user().email()).orElseThrow();
                return new Acl(entity.getId(), entity, user.getId(), user, p.admin(), p.readonly(), null,
                        null, LocalDateTime.now(), LocalDateTime.now());
            }).toList();
            entity.setAcls(acls);
            groupRepository.save(entity);
        }
        return getGroup(entity.getId(), userId);
    }

    public GroupDto updateGroup(GroupDto dto, Long userId) {
        var entity = groupRepository.findById(dto.id()).orElseThrow();
        if (entity.getOwner().getId().equals(userId)) {
            entity.setName(dto.fullname());
        }
        entity.setUpdated(LocalDateTime.now());
        entity = groupRepository.save(entity);
        for (var account : dto.accounts()) {
            if (account.id() == null) {
                if ((account.deleted() == null || !account.deleted())) {
                    var accountEntity = new Account(null, entity, account.name(), account.currency(),
                            account.startBalance() == null ? .0 : account.startBalance(), false,
                            LocalDateTime.now(), LocalDateTime.now());
                    entity.getAccounts().add(accountEntity);
                }
            } else {
                Account accountEntity = entity.getAccounts().stream().filter(a -> account.id().equals(a.getId()))
                        .findFirst().orElseThrow();
                accountEntity.setName(account.name());
                accountEntity.setUpdated(LocalDateTime.now());
                accountEntity.setDeleted(account.deleted() != null && account.deleted());
            }
        }
        for (var permission : dto.permissions()) {
            var user = userRepository.findByEmail(permission.user().email()).orElseThrow();
            var acl = entity.getAcls().stream().filter(a -> user.getId().equals(a.getUserId())).findFirst()
                    .orElse(null);
            if (acl == null) {
                entity.getAcls()
                        .add(new Acl(entity.getId(), entity, user.getId(), user, permission.admin(),
                                permission.readonly(), null,
                                null, LocalDateTime.now(), LocalDateTime.now()));
            } else {
                if (acl.getUserId().equals(userId)) {
                    var fullname = permission.admin() ? entity.getName() : (entity.getName() + " (" + entity.getOwner().getName() + ")");
                    acl.setName(dto.fullname().equals(fullname) ? null : dto.fullname());
                }
                acl.setAdmin(permission.admin());
                acl.setReadonly(permission.readonly());
                acl.setUpdated(LocalDateTime.now());
            }
        }
        entity.setAcls(entity.getAcls().stream().filter(
                a -> dto.permissions().stream().anyMatch(p -> p.user().email().equals(a.getUser().getEmail())))
                .collect(Collectors.toList()));

        groupRepository.save(entity);
        return getGroup(dto.id(), userId);
    }

    public void deleteGroup(Long groupId, Long userId) {
        var groupEntity = groupRepository.findById(groupId).orElseThrow();
        groupEntity.setDeleted(true);
        groupEntity.setUpdated(LocalDateTime.now());
        groupRepository.save(groupEntity);
    }

    public List<String> findUsers(String query) {
        return userRepository.findFirst10ByEmailContainingIgnoreCase(query).stream().map(u -> u.getEmail())
                .toList();
    }
}
