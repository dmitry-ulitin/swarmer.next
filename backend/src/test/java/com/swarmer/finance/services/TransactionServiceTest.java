package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.TestPropertySource;

import com.swarmer.finance.dto.AccountDto;
import com.swarmer.finance.dto.ImportDto;
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
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;

import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public class TransactionServiceTest {
        private final TransactionService transactionService;
        private final EntityManager em;

        private final User user = new User(null, "test@test.com", "{noop}123456", true, "Test", "USD",
                        LocalDateTime.now(),
                        LocalDateTime.now());
        private final AccountGroup bank = new AccountGroup(null, user, List.of(), null, "Bank", false,
                        LocalDateTime.now(), LocalDateTime.now());
        private final Account bankUSD = new Account(null, bank, "", "USD",
                        .0, false, LocalDateTime.now(), LocalDateTime.now());
        private final Account bankRUB = new Account(null, bank, "", "RUB",
                        .0, false, LocalDateTime.now(), LocalDateTime.now());

        private final AccountGroup savings = new AccountGroup(null, user, List.of(), null, "Savings", false,
                        LocalDateTime.now(), LocalDateTime.now());
        private final Account savingsUSD = new Account(null, bank, "", "USD",
                        .0, false, LocalDateTime.now(), LocalDateTime.now());

        private final Category education = Category.builder().name("Education")
                        .parentId(TransactionType.EXPENSE.getValue())
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Category car = Category.builder().name("car")
                        .parentId(TransactionType.EXPENSE.getValue())
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Category fuel = Category.builder().name("fuel")
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Category salary = Category.builder().name("Salary").parentId(TransactionType.INCOME.getValue())
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Category refund = Category.builder().name("Refund").parentId(TransactionType.INCOME.getValue())
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction income = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 1, 0, 0, 0))
                        .debit(1000.0).recipient(bankUSD).credit(1000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now())
                        .build();
        private final Transaction transfer = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 5, 0, 0, 0))
                        .account(bankUSD).debit(500.0).recipient(bankRUB).credit(50000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction expense = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 10, 0, 0, 0))
                        .account(bankRUB).debit(10000.0).credit(10000.0).category(fuel)
                        .created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction correctionUSD = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 30, 0, 0, 0))
                        .account(bankUSD).debit(300.0).credit(300.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction correctionRUB = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 30, 0, 0, 0))
                        .account(bankRUB).debit(30000.0).credit(30000.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction bank2save = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 27, 0, 0, 0))
                        .account(bankUSD).debit(100.0).recipient(savingsUSD).credit(100.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();
        private final Transaction save2bank = Transaction.builder().owner(user)
                        .opdate(LocalDateTime.of(2022, 1, 28, 0, 0, 0))
                        .account(savingsUSD).debit(100.0).recipient(bankUSD).credit(100.0).created(LocalDateTime.now())
                        .updated(LocalDateTime.now()).build();

        public TransactionServiceTest(GroupRepository groupRepository, UserRepository userRepository,
                        TransactionRepository transactionRepository, AccountRepository accountRepository,
                        AclRepository aclRepository, CategoryRepository categoryRepository, EntityManager em) {
                var aclService = new AclService(aclRepository, groupRepository);
                var categoryService = new CategoryService(categoryRepository, aclService);
                this.transactionService = new TransactionService(transactionRepository, accountRepository,
                                userRepository, aclService, categoryService, em);
                this.em = em;
        }

        @BeforeEach
        void init() {
                var correction = em.find(Category.class, TransactionType.CORRECTION.getValue());
                em.persist(user);
                em.persist(salary);
                em.persist(refund);
                em.persist(education);
                em.persist(car);
                fuel.setParentId(car.getId());
                em.persist(fuel);

                bank.setAccounts(List.of(bankUSD, bankRUB));
                em.persist(bank);
                savings.setAccounts(List.of(savingsUSD));
                em.persist(savings);

                em.persist(income);
                em.persist(transfer);
                em.persist(expense);
                em.persist(bank2save);
                em.persist(save2bank);
                correctionUSD.setCategory(correction);
                em.persist(correctionUSD);
                correctionRUB.setCategory(correction);
                em.persist(correctionRUB);

                em.flush();
                em.refresh(salary);
                em.refresh(refund);
                em.refresh(education);
                em.refresh(car);
                em.refresh(fuel);
        }

        @Test
        void testCreateTransaction() {
                var trx1 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 20, 0, 0, 0),
                                TransactionType.EXPENSE,
                                AccountDto.from(bankRUB, user.getId(), null), 10000., null, 10000.,
                                Category.builder().name("Food").ownerId(user.getId())
                                                .parentId(TransactionType.EXPENSE.getValue()).build(),
                                null,
                                "",
                                "");
                var trx2 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 21, 0, 0, 0),
                                TransactionType.EXPENSE,
                                AccountDto.from(bankRUB, user.getId(), null), 30000., null, 30000., education, null,
                                "",
                                "");
                var trx3 = new TransactionDto(null, user.getId(), LocalDateTime.of(2022, 1, 25, 0, 0, 0),
                                TransactionType.INCOME,
                                null, 10000., AccountDto.from(bankRUB, user.getId(), null), 10000., salary, null, "",
                                "");
                // create expense 10000
                var actual = transactionService.createTransaction(trx1, user.getId());
                assertThat(actual.id()).isNotNull();
                assertThat(actual.category()).isNotNull();
                assertThat(actual.category().getId()).isNotNull();
                // correction must decrease to 20000
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(20000.);
                assertThat(correctionRUB.getAccount()).isNotNull();
                assertThat(correctionRUB.getRecipient()).isNull();
                // create expense 30000
                actual = transactionService.createTransaction(trx2, user.getId());
                assertThat(actual.id()).isNotNull();
                // correction must become positive 10000
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(10000.);
                assertThat(correctionRUB.getAccount()).isNull();
                assertThat(correctionRUB.getRecipient()).isNotNull();
                // create income 10000
                actual = transactionService.createTransaction(trx3, user.getId());
                assertThat(actual.id()).isNotNull();
                // correction must be deleted
                assertThat(em.contains(correctionRUB)).isFalse();
        }

        @Test
        void testDeleteTransactionExpense() {
                transactionService.deleteTransaction(expense.getId(), user.getId());
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(40000.);
        }

        @Test
        void testDeleteTransactionTransfer() {
                transactionService.deleteTransaction(transfer.getId(), user.getId());
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(20000.);
                assertThat(correctionRUB.getAccount()).isNull();
                assertThat(correctionRUB.getRecipient()).isNotNull();
        }

        @Test
        void testGetBalances() {
                var balances = transactionService.getBalances(List.of(bankUSD.getId(), bankRUB.getId()));
                assertThat(balances).hasSize(6);
                var acc1Income = balances.stream()
                                .filter(b -> b.getAccountId() == null && bankUSD.getId().equals(b.getRecipientId()))
                                .findFirst();
                assertThat(acc1Income.isPresent()).isTrue();
                assertThat(acc1Income.get().getCredit()).isEqualTo(1000.);
                assertThat(acc1Income.get().getDebit()).isEqualTo(1000.);
                var acc2Expense = balances.stream()
                                .filter(b -> bankRUB.getId().equals(b.getAccountId()) && b.getRecipientId() == null)
                                .findFirst();
                assertThat(acc2Expense.isPresent()).isTrue();
                assertThat(acc2Expense.get().getCredit()).isEqualTo(40000.);
                assertThat(acc2Expense.get().getDebit()).isEqualTo(40000.);
        }

        @Test
        void testGetSummary() {
                var summary = transactionService.getSummary(user.getId(), List.of(bankUSD.getId(), bankRUB.getId()),
                                null, null);
                assertThat(summary).hasSize(2);
                var usd = summary.stream().filter(s -> "USD".equals(s.getCurrency())).findFirst();
                assertThat(usd.isPresent()).isTrue();
                assertThat(usd.get().getCredit()).isEqualTo(1000.);
                assertThat(usd.get().getDebit()).isEqualTo(300.);
                var rub = summary.stream().filter(s -> "RUB".equals(s.getCurrency())).findFirst();
                assertThat(rub.isPresent()).isTrue();
                assertThat(rub.get().getCredit()).isEqualTo(0.);
                assertThat(rub.get().getDebit()).isEqualTo(40000.);
        }

        @Test
        void testGetSummaryUsd() {
                var summary = transactionService.getSummary(user.getId(), List.of(bankUSD.getId()),
                                null, null);
                assertThat(summary).hasSize(1);
                var usd = summary.stream().findFirst();
                assertThat(usd.isPresent()).isTrue();
                assertThat(usd.get().getCurrency()).isEqualTo(bankUSD.getCurrency());
                assertThat(usd.get().getCredit()).isEqualTo(1000.);
                assertThat(usd.get().getDebit()).isEqualTo(300.);
        }

        @Test
        void testGetSummaryFrom() {
                var summary = transactionService.getSummary(user.getId(), List.of(bankUSD.getId(), bankRUB.getId()),
                                LocalDateTime.of(2022, 1, 5, 0, 0, 0), null);
                assertThat(summary).hasSize(2);
                var usd = summary.stream().filter(s -> "USD".equals(s.getCurrency())).findFirst();
                assertThat(usd.isPresent()).isTrue();
                assertThat(usd.get().getCredit()).isEqualTo(0.);
        }

        @Test
        void testGetTransaction() {
                var actual = transactionService.getTransaction(transfer.getId(), user.getId());
                assertThat(actual.id()).isEqualTo(transfer.getId());
                assertThat(actual.ownerId()).isEqualTo(transfer.getOwner().getId());
                assertThat(actual.opdate()).isEqualTo(transfer.getOpdate());
                assertThat(actual.type()).isEqualTo(TransactionType.TRANSFER);
                assertThat(actual.account().fullname()).isEqualTo("Bank USD");
                assertThat(actual.category()).isNull();
                assertThat(actual.currency()).isEqualTo(transfer.getCurrency());
                assertThat(actual.party()).isEqualTo(transfer.getParty());
                assertThat(actual.details()).isEqualTo(transfer.getDetails());
        }

        @Test
        void testGetTransactions() {
                var trx = transactionService.getTransactions(user.getId(), List.of(bankRUB.getId()), "", null, null,
                                null, 0, 0);
                assertThat(trx).hasSize(3);
                assertThat(trx.stream().map(TransactionDto::id).collect(Collectors.toList()))
                                .containsExactly(correctionRUB.getId(), expense.getId(), transfer.getId());
        }

        @Test
        void testGetTransactionsFromTo() {
                var trx = transactionService.getTransactions(user.getId(), List.of(), null, null,
                                LocalDateTime.of(2022, 1, 5, 0, 0, 0), LocalDateTime.of(2022, 1, 26, 0, 0, 0), 0, 0);
                assertThat(trx).hasSize(2);
                assertThat(trx.stream().map(TransactionDto::id).collect(Collectors.toList()))
                                .containsExactly(expense.getId(), transfer.getId());
        }

        @Test
        void testGetTransactionsByCategory() {
                var trx = transactionService.getTransactions(user.getId(), List.of(), null, car.getId(),
                                null, null, 0, 0);
                assertThat(trx).hasSize(1);
                assertThat(trx.stream().map(TransactionDto::id).collect(Collectors.toList()))
                                .containsExactly(expense.getId());
        }

        @Test
        void testGetTransactionsSearch() {
                var trx = transactionService.getTransactions(user.getId(), List.of(), "uel", null, null, null, 0, 0);
                assertThat(trx).hasSize(1);
                assertThat(trx.get(0).id()).isEqualTo(expense.getId());
        }

        @Test
        void testGetTransactionsSearchEmpty() {
                var trx = transactionService.getTransactions(user.getId(), List.of(), "ducduc", null, null, null, 100,
                                50);
                assertThat(trx).hasSize(0);
        }

        @Test
        void testUpdateTransactionExpense() {
                var dto = transactionService.getTransaction(expense.getId(), user.getId());
                var amount = dto.debit() + 10000.;
                var updated = new TransactionDto(dto.id(), dto.ownerId(), dto.opdate(), dto.type(),
                                dto.account(), amount, dto.recipient(), amount, dto.category(), dto.currency(),
                                "new party", "new details");
                var actual = transactionService.updateTransaction(updated, user.getId());
                assertThat(actual.debit()).isEqualTo(updated.debit());
                assertThat(actual.party()).isEqualTo(updated.party());
                assertThat(actual.details()).isEqualTo(updated.details());
                // correction must decrease from 30000 to 20000
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(20000.);
                assertThat(correctionRUB.getAccount()).isNotNull();
                assertThat(correctionRUB.getRecipient()).isNull();
        }

        @Test
        void testUpdateTransactionTransfer() {
                var dto = transactionService.getTransaction(transfer.getId(), user.getId());
                var debit = dto.debit() + 100.;
                var credit = dto.credit() + 10000.;
                var updated = new TransactionDto(dto.id(), dto.ownerId(), dto.opdate(), dto.type(),
                                dto.account(), debit, dto.recipient(), credit, dto.category(), dto.currency(),
                                "new party", "new details");
                var actual = transactionService.updateTransaction(updated, user.getId());
                assertThat(actual.debit()).isEqualTo(updated.debit());
                assertThat(actual.party()).isEqualTo(updated.party());
                assertThat(actual.details()).isEqualTo(updated.details());
                // correction must increase from 30000 to 40000
                assertThat(em.contains(correctionRUB)).isTrue();
                assertThat(correctionRUB.getDebit()).isEqualTo(40000.);
                assertThat(correctionRUB.getAccount()).isNotNull();
                assertThat(correctionRUB.getRecipient()).isNull();
        }

        @Test
        void testGetCategoriesSummaryExpense() {
                var summaries = transactionService.getCategoriesSummary(user.getId(), TransactionType.EXPENSE,
                                List.of(bankUSD.getId(), bankRUB.getId()),
                                LocalDateTime.of(2022, 1, 1, 0, 0, 0), LocalDateTime.of(2022, 1, 10, 23, 59, 59));
                assertThat(summaries).hasSize(1);
                var summary = summaries.stream().findFirst();
                assertThat(summary.get().getCategory().getId()).isEqualTo(car.getId());
                assertThat(summary.get().getAmount()).isEqualTo(expense.getDebit());
                assertThat(summary.get().getCurrency()).isEqualTo(expense.getAccount().getCurrency());
        }

        @Test
        void testGetCategoriesSummaryIncome() {
                var summaries = transactionService.getCategoriesSummary(user.getId(), TransactionType.INCOME,
                                List.of(bankUSD.getId(), bankRUB.getId()),
                                LocalDateTime.of(2022, 1, 1, 0, 0, 0), LocalDateTime.of(2022, 1, 10, 23, 59, 59));
                assertThat(summaries).hasSize(1);
                var summary = summaries.stream().findFirst();
                assertThat(summary.get().getAmount()).isEqualTo(income.getCredit());
                assertThat(summary.get().getCurrency()).isEqualTo(income.getRecipient().getCurrency());
        }

        @Test
        void testSaveImport() {
                var importDto1 = ImportDto.builder()
                                .id(income.getId())
                                .opdate(income.getOpdate())
                                .currency(income.getRecipient().getCurrency())
                                .party("party1")
                                .details("details1")
                                .debit(income.getDebit())
                                .credit(income.getCredit())
                                .category(income.getCategory())
                                .type(TransactionType.INCOME)
                                .selected(false)
                                .build();
                var importDto2 = ImportDto.builder()
                                .opdate(LocalDateTime.of(2022, 1, 25, 0, 0, 0))
                                .currency(bankUSD.getCurrency())
                                .party("party2")
                                .details("details2")
                                .debit(400.)
                                .credit(400.)
                                .category(education)
                                .type(TransactionType.EXPENSE)
                                .selected(true)
                                .build();
                var importDto3 = ImportDto.builder()
                                .opdate(LocalDateTime.of(2022, 1, 26, 0, 0, 0))
                                .currency(bankUSD.getCurrency())
                                .party("party3")
                                .details("details3")
                                .debit(100.)
                                .credit(100.)
                                .category(refund)
                                .type(TransactionType.INCOME)
                                .selected(true)
                                .build();
                transactionService.saveImport(List.of(importDto1, importDto2, importDto3), bankUSD.getId(),
                                user.getId());
                var actual1 = transactionService.getTransaction(importDto1.getId(), user.getId());
                assertThat(actual1).isNotNull();
                assertThat(actual1.party()).isEqualTo(importDto1.getParty());
                assertThat(actual1.details()).isEqualTo(importDto1.getDetails());

                assertThat(importDto2.getId()).isNotNull();
                var actual2 = transactionService.getTransaction(importDto2.getId(), user.getId());
                assertThat(actual2).isNotNull();
                assertThat(actual2.opdate()).isEqualTo(importDto2.getOpdate());
                assertThat(actual2.account()).isNotNull();
                assertThat(actual2.account().id()).isEqualTo(bankUSD.getId());
                assertThat(actual2.party()).isEqualTo(importDto2.getParty());
                assertThat(actual2.details()).isEqualTo(importDto2.getDetails());
                assertThat(actual2.debit()).isEqualTo(importDto2.getDebit());
                assertThat(actual2.credit()).isEqualTo(importDto2.getCredit());
                assertThat(actual2.category()).isNotNull();
                assertThat(actual2.category().getId()).isEqualTo(education.getId());
                assertThat(actual2.recipient()).isNull();
                assertThat(actual2.type()).isEqualTo(importDto2.getType());
        }
}
