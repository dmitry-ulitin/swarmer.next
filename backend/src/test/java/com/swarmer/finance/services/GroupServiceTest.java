package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import com.swarmer.finance.dto.AccountDto;
import com.swarmer.finance.dto.GroupDto;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.User;
import com.swarmer.finance.repositories.AccountRepository;
import com.swarmer.finance.repositories.AclRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.RuleRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;

import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
public class GroupServiceTest {
        private final GroupService groupService;
        private final EntityManager em;

        private final User user = new User(null, "test@test.com", "{noop}123456", true, "Test", "USD",
                        LocalDateTime.now(),
                        LocalDateTime.now());
        private final AccountGroup group = new AccountGroup(null, user, List.of(), null, "Test Group 1", false,
                        LocalDateTime.now(), LocalDateTime.now());
        private final Account account1 = new Account(null, group, "", "USD",
                        .0, false,
                        LocalDateTime.now(), LocalDateTime.now());
        private final Account account2 = new Account(null, group, "", "EUR",
                        .0, false,
                        LocalDateTime.now(), LocalDateTime.now());

        @Autowired
        public GroupServiceTest(GroupRepository groupRepository, UserRepository userRepository,
                        TransactionRepository transactionRepository, AccountRepository accountRepository,
                        AclRepository aclRepository, RuleRepository ruleRepository, EntityManager em) {
                var aclService = new AclService(aclRepository, groupRepository);
                var transactionService = new TransactionService(transactionRepository, accountRepository,
                                userRepository, ruleRepository, aclService, em);
                groupService = new GroupService(groupRepository, userRepository, transactionService, aclService);
                this.em = em;
        }

        @BeforeEach
        void init() {
                em.persist(user);
                group.setAccounts(new ArrayList<>(List.of(account1, account2)));
                em.persist(group);
                em.flush();
        }

        @Test
        void testCreateGroup() {
                var acc1 = new AccountDto(null, null, null, "USD", null, 1000.0, false);
                var acc2 = new AccountDto(null, null, null, "RUB", null, 1000.0, true);
                var grp = new GroupDto(null, null, "Test Group 2", false, false, false, List.of(acc1, acc2), List.of(),
                                false,
                                LocalDateTime.now(), LocalDateTime.now());
                var actual = groupService.createGroup(grp, user.getId());

                assertThat(actual.id()).isNotNull();
                assertThat(actual.ownerId()).isEqualTo(user.getId());
                assertThat(actual.fullname()).isEqualTo(grp.fullname());
                assertThat(actual.owner()).isTrue();
                assertThat(actual.accounts()).hasSize(1);
                assertThat(actual.accounts().get(0).fullname()).isEqualTo(grp.fullname());
        }

        @Test
        void testDeleteGroup() {
                groupService.deleteGroup(group.getId(), user.getId());
                var grp = groupService.getGroup(group.getId(), user.getId());
                assertThat(grp.deleted()).isTrue();
        }

        @Test
        void testUpdateGroup() {
                var dto = groupService.getGroup(group.getId(), user.getId());
                var accounts = new ArrayList<>(dto.accounts());
                accounts.add(new AccountDto(null, null, null, "RUB", null, 1000.0, false));
                accounts.add(new AccountDto(null, null, null, "RUB", null, 1000.0, true));
                var permissions = dto.permissions();
                var updated = new GroupDto(dto.id(), dto.ownerId(), "New name", dto.owner(), dto.coowner(),
                                dto.shared(), accounts, permissions, dto.deleted(), dto.created(), dto.updated());
                var actual = groupService.updateGroup(updated, user.getId());
                assertThat(actual.fullname()).isEqualTo(updated.fullname());
                assertThat(actual.accounts()).hasSize(3);
        }
}