package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import com.swarmer.finance.dto.AccountDto;
import com.swarmer.finance.dto.TransactionDto;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.Category;
import com.swarmer.finance.models.Transaction;
import com.swarmer.finance.models.TransactionType;
import com.swarmer.finance.models.User;
import com.swarmer.finance.repositories.AccountRepository;
import com.swarmer.finance.repositories.AclRepository;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.RuleRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;

import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
public class TransactionServiceTest {
        private final TransactionService transactionService;
        private final EntityManager em;

        private final User user = new User(null, "test@test.com", "{noop}123456", true, "Test", "USD",
                        LocalDateTime.now(),
                        LocalDateTime.now());
        private final AccountGroup group = new AccountGroup(null, user, List.of(), null, "Test Group", false,
                        LocalDateTime.now(), LocalDateTime.now());
        private final Account account1 = new Account(null, group, "", "USD",
                        .0, false, LocalDateTime.now(), LocalDateTime.now());
        private final Account account2 = new Account(null, group, "", "RUB",
                        .0, false, LocalDateTime.now(), LocalDateTime.now());
        private final Category education = Category.builder().name("Education").parentId(1L)
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Category salary = Category.builder().name("Salary").parentId(2L).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction income = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 1, 0, 0, 0))
                        .debit(1000.0).recipient(account1).credit(1000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now())
                        .build();
        private final Transaction transfer = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 5, 0, 0, 0))
                        .account(account1).debit(500.0).recipient(account2).credit(50000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction expense = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 10, 0, 0, 0))
                        .account(account2).debit(10000.0).credit(10000.0).category(education)
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction correction = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 30, 0, 0, 0))
                        .account(account2).debit(30000.0).credit(30000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();

        @Autowired
        public TransactionServiceTest(GroupRepository groupRepository, UserRepository userRepository,
                        TransactionRepository transactionRepository, AccountRepository accountRepository,
                        AclRepository aclRepository, RuleRepository ruleRepository,
                        CategoryRepository categoryRepository, EntityManager em) {
                var aclService = new AclService(aclRepository, groupRepository);
                var categoryService = new CategoryService(categoryRepository, aclService);
                this.transactionService = new TransactionService(transactionRepository, accountRepository,
                                userRepository, ruleRepository, aclService, categoryService, em);
                this.em = em;
        }

        @BeforeEach
        void init() {
                em.persist(user);
                em.persist(education);
                em.persist(salary);
                group.setAccounts(List.of(account1, account2));
                em.persist(group);
                correction.setCategory(em.find(Category.class, 3L));
                em.persist(income);
                em.persist(transfer);
                em.persist(expense);
                em.persist(correction);
                em.flush();
        }

        @Test
        void testCreateTransaction() {
                var trx1 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 20, 0, 0, 0),
                                TransactionType.EXPENSE,
                                AccountDto.from(account2, user.getId(), null), 10000., null, 10000., education, null,
                                "",
                                "");
                var trx2 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 21, 0, 0, 0),
                                TransactionType.EXPENSE,
                                AccountDto.from(account2, user.getId(), null), 30000., null, 30000., education, null,
                                "",
                                "");
                var trx3 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 25, 0, 0, 0),
                                TransactionType.INCOME,
                                null, 10000., AccountDto.from(account2, user.getId(), null), 10000., salary, null, "",
                                "");
                // create expense 10000
                var actual = transactionService.createTransaction(trx1, user.getId());
                assertThat(actual.id()).isNotNull();
                // correction must decrease to 20000
                assertThat(em.contains(correction)).isTrue();
                assertThat(correction.getDebit()).isEqualTo(20000.);
                assertThat(correction.getAccount()).isNotNull();
                assertThat(correction.getRecipient()).isNull();
                // create expense 30000
                actual = transactionService.createTransaction(trx2, user.getId());
                assertThat(actual.id()).isNotNull();
                // correction must become positive 10000
                assertThat(em.contains(correction)).isTrue();
                assertThat(correction.getDebit()).isEqualTo(10000.);
                assertThat(correction.getAccount()).isNull();
                assertThat(correction.getRecipient()).isNotNull();
                // create income 10000
                actual = transactionService.createTransaction(trx3, user.getId());
                assertThat(actual.id()).isNotNull();
                // correction must be deleted
                assertThat(em.contains(correction)).isFalse();
        }

        @Test
        void testDeleteTransaction() {
                transactionService.deleteTransaction(expense.getId(), user.getId());
                assertThat(em.contains(correction)).isTrue();
                assertThat(correction.getDebit()).isEqualTo(40000.);
        }

        @Test
        void testGetBalances() {
                var balances = transactionService.getBalances(List.of(account1.getId(), account2.getId()));
                assertThat(balances).hasSize(3);
                var acc1Income = balances.stream()
                                .filter(b -> b.getAccountId() == null && account1.getId().equals(b.getRecipientId()))
                                .findFirst();
                assertThat(acc1Income.isPresent()).isTrue();
                assertThat(acc1Income.get().getCredit()).isEqualTo(1000.);
                assertThat(acc1Income.get().getDebit()).isEqualTo(1000.);
                var acc2Expense = balances.stream()
                                .filter(b -> account2.getId().equals(b.getAccountId()) && b.getRecipientId() == null)
                                .findFirst();
                assertThat(acc2Expense.isPresent()).isTrue();
                assertThat(acc2Expense.get().getCredit()).isEqualTo(40000.);
                assertThat(acc2Expense.get().getDebit()).isEqualTo(40000.);
        }

        @Test
        void testGetSummary() {
                var summary = transactionService.getSummary(user.getId(), List.of(account1.getId(), account2.getId()),
                                null, null);
                assertThat(summary).hasSize(2);
                var usd = summary.stream().filter(s -> "USD".equals(s.getCurrency())).findFirst();
                assertThat(usd.isPresent()).isTrue();
                assertThat(usd.get().getCredit()).isEqualTo(1000.);
                assertThat(usd.get().getDebit()).isEqualTo(0.);
                var rub = summary.stream().filter(s -> "RUB".equals(s.getCurrency())).findFirst();
                assertThat(rub.isPresent()).isTrue();
                assertThat(rub.get().getCredit()).isEqualTo(0.);
                assertThat(rub.get().getDebit()).isEqualTo(40000.);
        }

        @Test
        void testGetTransaction() {
                var actual = transactionService.getTransaction(transfer.getId(), user.getId());
                assertThat(actual.id()).isEqualTo(transfer.getId());
                assertThat(actual.ownerId()).isEqualTo(transfer.getOwner().getId());
                assertThat(actual.opdate()).isEqualTo(transfer.getOpdate());
                assertThat(actual.type()).isEqualTo(TransactionType.TRANSFER);
                assertThat(actual.account().fullname()).isEqualTo("Test Group USD");
                assertThat(actual.category()).isNull();
                assertThat(actual.currency()).isEqualTo(transfer.getCurrency());
                assertThat(actual.party()).isEqualTo(transfer.getParty());
                assertThat(actual.details()).isEqualTo(transfer.getDetails());
        }

        @Test
        void testGetTransactions() {
                var trx = transactionService.getTransactions(user.getId(), List.of(), "duc", null, null, null, 0, 0);
                assertThat(trx).hasSize(1);
                assertThat(trx.get(0).id()).isEqualTo(expense.getId());
        }

        @Test
        void testUpdateTransaction() {
                var dto = transactionService.getTransaction(expense.getId(), user.getId());
                var amount = dto.debit() + 10000.;
                var updated = new TransactionDto(dto.id(), dto.ownerId(), dto.opdate(), dto.type(),
                                dto.account(), amount, dto.recipient(), amount, dto.category(), dto.currency(),
                                "new party", "new details");
                var actual = transactionService.updateTransaction(updated, user.getId());
                assertThat(actual.debit()).isEqualTo(updated.debit());
                assertThat(actual.party()).isEqualTo(updated.party());
                assertThat(actual.details()).isEqualTo(updated.details());
                // correction must decrease to 20000
                assertThat(em.contains(correction)).isTrue();
                assertThat(correction.getDebit()).isEqualTo(20000.);
                assertThat(correction.getAccount()).isNotNull();
                assertThat(correction.getRecipient()).isNull();
        }
}
