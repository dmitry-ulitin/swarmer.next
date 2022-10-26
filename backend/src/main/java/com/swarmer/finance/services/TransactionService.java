package com.swarmer.finance.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.NumberFormat;
import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.CategoryIdSum;
import com.swarmer.finance.dto.CategorySum;
import com.swarmer.finance.dto.ImportDto;
import com.swarmer.finance.dto.Summary;
import com.swarmer.finance.dto.TransactionDto;
import com.swarmer.finance.dto.TransactionSum;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.Category;
import com.swarmer.finance.models.ConditionType;
import com.swarmer.finance.models.Transaction;
import com.swarmer.finance.models.TransactionType;
import com.swarmer.finance.repositories.AccountRepository;
import com.swarmer.finance.repositories.RuleRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.JoinType;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final RuleRepository ruleRepository;
    private final AclService aclService;
    private final EntityManager entityManager;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository,
            UserRepository userRepository, RuleRepository ruleRepository, AclService aclService,
            EntityManager entityManager) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.ruleRepository = ruleRepository;
        this.aclService = aclService;
        this.entityManager = entityManager;
    }

    public List<TransactionDto> getTransactions(Long userId, int offset, int limit, Collection<Long> accountIds,
            String search, LocalDateTime from, LocalDateTime to) {
        var trx = queryTransactions(userId, offset, limit, accountIds, search, from, to);
        if (trx.isEmpty()) {
            return List.of();
        }
        var rawBalnces = getBalances(accountIds, null, trx.get(trx.size() - 1).getOpdate(),
                trx.get(trx.size() - 1).getId());
        Map<Long, Double> accBalances = new HashMap<>();
        var dto = new TransactionDto[trx.size()];
        for (int index = trx.size() - 1; index >= 0; index--) {
            var transaction = trx.get(index);
            Double accountBalance = null;
            if (transaction.getAccount() != null) {
                accountBalance = accBalances.get(transaction.getAccount().getId());
                if (accountBalance == null) {
                    accountBalance = transaction.getAccount().getStart_balance();
                    accountBalance -= rawBalnces.stream()
                            .filter(b -> transaction.getAccount().getId().equals(b.getAccountId()))
                            .mapToDouble(b -> b.getDebit()).sum();
                    accountBalance += rawBalnces.stream()
                            .filter(b -> transaction.getAccount().getId().equals(b.getRecipientId()))
                            .mapToDouble(b -> b.getCredit()).sum();
                }
                accountBalance -= transaction.getDebit();
                accBalances.put(transaction.getAccount().getId(), accountBalance);
            }
            Double recipientBalance = null;
            if (transaction.getRecipient() != null) {
                recipientBalance = accBalances.get(transaction.getRecipient().getId());
                if (recipientBalance == null) {
                    recipientBalance = transaction.getRecipient().getStart_balance();
                    recipientBalance -= rawBalnces.stream()
                            .filter(b -> transaction.getRecipient().getId().equals(b.getAccountId()))
                            .mapToDouble(b -> b.getDebit()).sum();
                    recipientBalance += rawBalnces.stream()
                            .filter(b -> transaction.getRecipient().getId().equals(b.getRecipientId()))
                            .mapToDouble(b -> b.getCredit()).sum();
                }
                recipientBalance += transaction.getCredit();
                accBalances.put(transaction.getRecipient().getId(), recipientBalance);
            }
            dto[index] = TransactionDto.from(transaction, userId, accountBalance, recipientBalance);
        }
        return Arrays.asList(dto);
    }

    public TransactionDto getTransaction(Long id, Long userId) {
        var transaction = transactionRepository.findById(id).orElseThrow();
        Double accountBalance = null;
        Double recipientBalance = null;
        var ai = new ArrayList<Long>();
        if (transaction.getAccount() != null) {
            ai.add(transaction.getAccount().getId());
        }
        if (transaction.getRecipient() != null) {
            ai.add(transaction.getRecipient().getId());
        }
        var balances = getBalances(ai, null, transaction.getOpdate(), transaction.getId());
        if (transaction.getAccount() != null) {
            accountBalance = transaction.getAccount().getStart_balance();
            accountBalance -= balances.stream().filter(b -> transaction.getAccount().getId().equals(b.getAccountId()))
                    .mapToDouble(b -> b.getDebit()).sum();
            accountBalance += balances.stream().filter(b -> transaction.getAccount().getId().equals(b.getRecipientId()))
                    .mapToDouble(b -> b.getCredit()).sum();
            accountBalance -= transaction.getDebit();
        }
        if (transaction.getRecipient() != null) {
            recipientBalance = transaction.getRecipient().getStart_balance();
            recipientBalance -= balances.stream()
                    .filter(b -> transaction.getRecipient().getId().equals(b.getAccountId()))
                    .mapToDouble(b -> b.getDebit()).sum();
            recipientBalance += balances.stream()
                    .filter(b -> transaction.getRecipient().getId().equals(b.getRecipientId()))
                    .mapToDouble(b -> b.getCredit()).sum();
            recipientBalance += transaction.getCredit();
        }
        return TransactionDto.from(transaction, userId, accountBalance, recipientBalance);
    }

    public TransactionDto createTransaction(TransactionDto dto, Long userId) {
        var entity = new Transaction();
        entity.setOwner(userRepository.findById(userId).orElseThrow());
        entity.setCreated(LocalDateTime.now());
        dto2entity(dto, entity);
        transactionRepository.save(entity);
        if (entity.getAccount() != null) {
            updateCorrections(entity.getAccount().getId(), entity.getDebit(), entity.getOpdate(), null, true);
        }
        if (entity.getRecipient() != null) {
            updateCorrections(entity.getRecipient().getId(), -entity.getCredit(), entity.getOpdate(), null, true);
        }
        return getTransaction(entity.getId(), userId);
    }

    public TransactionDto updateTransaction(TransactionDto dto, Long userId) {
        var entity = transactionRepository.findById(dto.id()).orElseThrow();
        if (entity.getAccount() != null) {
            updateCorrections(entity.getAccount().getId(), -entity.getDebit(), entity.getOpdate(), entity.getId(),
                    false);
        }
        if (entity.getRecipient() != null) {
            updateCorrections(entity.getRecipient().getId(), entity.getCredit(), entity.getOpdate(), entity.getId(),
                    false);
        }
        entity.setOwner(userRepository.findById(userId).orElseThrow());
        dto2entity(dto, entity);
        transactionRepository.save(entity);
        if (entity.getAccount() != null) {
            updateCorrections(entity.getAccount().getId(), entity.getDebit(), entity.getOpdate(), entity.getId(), true);
        }
        if (entity.getRecipient() != null) {
            updateCorrections(entity.getRecipient().getId(), -entity.getCredit(), entity.getOpdate(), entity.getId(),
                    true);
        }
        return getTransaction(entity.getId(), userId);
    }

    public void deleteTransaction(Long id, Long userId) {
        var entity = transactionRepository.findById(id).orElseThrow();
        if (entity.getAccount() != null) {
            updateCorrections(entity.getAccount().getId(), -entity.getDebit(), entity.getOpdate(), entity.getId(),
                    true);
        }
        if (entity.getRecipient() != null) {
            updateCorrections(entity.getRecipient().getId(), entity.getCredit(), entity.getOpdate(), entity.getId(),
                    true);
        }
        transactionRepository.deleteById(id);
    }

    public List<TransactionSum> getBalances(Collection<Long> ai) {
        return getBalances(ai, null, null, null);
    }

    // select t.account.id, t.recipient.id, sum(t.debit), sum(t.credit) from
    // transactions t where t.account.id in :a or t.recipient.id in :a group by
    // t.account.id, t.recipient.id
    public List<TransactionSum> getBalances(Collection<Long> ai, LocalDateTime from, LocalDateTime to, Long id) {
        var builder = entityManager.getCriteriaBuilder();
        var criteriaQuery = builder.createQuery(TransactionSum.class);
        var root = criteriaQuery.from(Transaction.class);
        var where = builder.or(root.get("account").get("id").in(ai), root.get("recipient").get("id").in(ai));
        if (from != null) {
            var greaterThanOrEqualTo = builder.greaterThanOrEqualTo(root.<LocalDateTime>get("opdate"), from);
            where = builder.and(where, greaterThanOrEqualTo);
        }
        if (to != null) {
            var lessThanOpdate = builder.lessThan(root.<LocalDateTime>get("opdate"), to);
            if (id != null) {
                lessThanOpdate = builder.or(lessThanOpdate,
                        builder.and(builder.equal(root.<LocalDateTime>get("opdate"), to),
                                builder.lessThan(root.get("id"), id)));
            }
            where = builder.and(where, lessThanOpdate);
        }
        criteriaQuery.multiselect(root.get("account").get("id"), root.get("recipient").get("id"),
                builder.sumAsDouble(root.get("debit")).alias("debit"),
                builder.sumAsDouble(root.get("credit")).alias("credit"))
                .where(where)
                .groupBy(root.get("account").get("id"), root.get("recipient").get("id"));
        return entityManager.createQuery(criteriaQuery).getResultList();
    }

    public Collection<Summary> getSummary(Long userId, Collection<Long> accountIds, LocalDateTime from,
            LocalDateTime to) {
        Map<Long, Account> userAccounts = aclService.findAccounts(userId)
                .collect(Collectors.toMap(a -> a.getId(), a -> a));
        Map<Long, Account> resultAccounts = (accountIds.isEmpty() ? userAccounts.values()
                : accountRepository.findByIdIn(accountIds))
                .stream().collect(Collectors.toMap(a -> a.getId(), a -> a));
        var result = resultAccounts.values().stream().map(a -> a.getCurrency())
                .distinct()
                .collect(Collectors.toMap(c -> c, c -> new Summary(c, .0, .0, .0, .0)));
        var balances = getBalances(resultAccounts.keySet(), from, to, null);
        for (var b : balances) {
            if (resultAccounts.containsKey(b.getAccountId())) {
                var aCurrency = resultAccounts.get(b.getAccountId()).getCurrency();
                if (userAccounts.containsKey(b.getRecipientId())) {
                    if (!resultAccounts.containsKey(b.getRecipientId())) {
                        var rCurrency = userAccounts.get(b.getRecipientId()).getCurrency();
                        if (result.containsKey(rCurrency)) {
                            var rSummary = result.get(rCurrency);
                            rSummary.setTransfers_debit(rSummary.getTransfers_debit() + b.getCredit());
                        }
                    }
                } else {
                    var aSummary = result.get(aCurrency);
                    aSummary.setDebit(aSummary.getDebit() + b.getDebit());
                }
            }
            if (resultAccounts.containsKey(b.getRecipientId())) {
                var rCurrency = resultAccounts.get(b.getRecipientId()).getCurrency();
                if (userAccounts.containsKey(b.getAccountId())) {
                    if (!resultAccounts.containsKey(b.getAccountId())) {
                        var aCurrency = userAccounts.get(b.getAccountId()).getCurrency();
                        if (result.containsKey(aCurrency)) {
                            var aSummary = result.get(aCurrency);
                            aSummary.setTransfers_credit(aSummary.getTransfers_credit() + b.getDebit());
                        }
                    }
                } else {
                    var rSummary = result.get(rCurrency);
                    rSummary.setCredit(rSummary.getCredit() + b.getCredit());
                }
            }
        }
        return result.values();
    }

    public Collection<CategorySum> getCategoriesSummary(Long userId, TransactionType type, Collection<Long> accountIds,
            LocalDateTime from,
            LocalDateTime to) {
        var ai = accountIds.isEmpty() ? aclService.findAccounts(userId).map(a -> a.getId()).toList() : accountIds;
        var builder = entityManager.getCriteriaBuilder();
        var criteriaQuery = builder.createQuery(CategoryIdSum.class);
        var root = criteriaQuery.from(Transaction.class);
        var where = type == TransactionType.EXPENSE
                ? builder.and(root.get("account").get("id").in(ai), root.get("recipient").isNull())
                : builder.or(root.get("account").isNull(), root.get("recipient").get("id").in(ai));
        if (from != null) {
            var greaterThanOrEqualTo = builder.greaterThanOrEqualTo(root.<LocalDateTime>get("opdate"), from);
            where = builder.and(where, greaterThanOrEqualTo);
        }
        if (to != null) {
            var lessThanOpdate = builder.lessThan(root.<LocalDateTime>get("opdate"), to);
            where = builder.and(where, lessThanOpdate);
        }
        if (type == TransactionType.EXPENSE) {
            criteriaQuery.multiselect(root.get("category").get("id"),
                    root.get("account").get("currency"),
                    builder.sumAsDouble(root.get("debit")).alias("amount"))
                    .where(where)
                    .groupBy(root.get("category"), root.get("account").get("currency"));
        } else {
            criteriaQuery.multiselect(root.get("category").get("id"),
                    root.get("recipient").get("currency"),
                    builder.sumAsDouble(root.get("credit")).alias("amount"))
                    .where(where)
                    .groupBy(root.get("category").get("id"), root.get("recipient").get("currency"));
        }
        var categoryIdSums = entityManager.createQuery(criteriaQuery).getResultList();
        var categorySums = categoryIdSums.stream()
                .map(r -> new CategorySum(r.getId() == null ? null : entityManager.find(Category.class, r.getId()),
                        r.getCurrency(), r.getAmount()))
                .toList();
        // group by to parent category
        for (var cs : categorySums) {
            var category = cs.getCategory();
            if (category != null) {
                while (category.getLevel() > 1) {
                    category = entityManager.find(Category.class, category.getParentId());
                }
                cs.setCategory(category);
            } else {
                cs.setCategory(entityManager.find(Category.class, Long.valueOf(type.getValue())));
            }
        }
        var groups = categorySums.stream()
                .collect(Collectors.groupingBy(cs -> Pair.of(cs.getCurrency(), cs.getCategory())));
        return groups.entrySet().stream().map(e -> e.getValue().stream()
                .reduce(new CategorySum(e.getKey().getSecond(), e.getKey().getFirst(), .0), (a, g) -> {
                    a.setAmount(a.getAmount() + g.getAmount());
                    return a;
                })).sorted((a, b) -> a.getCategory().getFullName().compareToIgnoreCase(b.getCategory().getFullName()))
                .toList();
    }

    public List<ImportDto> importFile(InputStream is, Long accountId, Long bankId, Long userId)
            throws IOException {
        var format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true)
                .setTrim(true).build();
        if (bankId == 2) {
            format = format.builder().setDelimiter(';').build();
        }
        try (var fileReader = new BufferedReader(new InputStreamReader(is, bankId == 2 ? "cp1251" : "UTF-8"));
                var csvParser = new CSVParser(fileReader, format)) {
            var records = csvParser.getRecords().stream().map(r -> csv2trx(bankId, r)).toList();
            var minOpdate = records.stream().map(r -> r.getOpdate()).min((a, b) -> a.compareTo(b)).orElseThrow();
            var trx = queryTransactions(null, 0, 0, List.of(accountId), null, minOpdate, null);
            var rules = ruleRepository.findByOwnerId(userId);

            return records.stream().map(r -> {
                var stored = trx.stream()
                        .filter(t -> t.getOpdate().toLocalDate().equals(r.getOpdate().toLocalDate())
                                && (t.getAccount() != null
                                        && t.getAccount().getId().equals(accountId) && t.getDebit() == r.getDebit()
                                        || t.getRecipient() != null && t.getRecipient().getId().equals(accountId)
                                                && t.getCredit() == r.getCredit()))
                        .findFirst().orElse(null);
                if (stored != null) {
                    r.setId(stored.getId());
                    r.setSelected(false);
                    r.setCategory(stored.getCategory());
                    trx.remove(stored);
                    return r;
                }
                var rule = rules
                        .stream().filter(rl -> rl.getTransactionType().equals(r.getType())
                                && rl.getConditionType() == ConditionType.PARTY_EQUALS
                                && rl.getConditionValue().equals(r.getParty()))
                        .findFirst().orElse(null);
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getTransactionType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.DETAILS_EQUALS
                                    && rl.getConditionValue().equals(r.getDetails()))
                            .findFirst().orElse(null);
                }
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getTransactionType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.PARTY_CONTAINS && r.getParty() != null
                                    && r.getParty().toLowerCase().contains(rl.getConditionValue().toLowerCase()))
                            .findFirst().orElse(null);
                }
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getTransactionType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.DETAILS_CONTAINS && r.getDetails() != null
                                    && r.getDetails().toLowerCase().contains(rl.getConditionValue().toLowerCase()))
                            .findFirst().orElse(null);
                }
                if (rule != null) {
                    r.setCategory(rule.getCategory());
                }
                return r;
            }).toList();
        }
    }

    public void saveImport(List<ImportDto> records, Long accountId, Long userId) {
        var owner = userRepository.findById(userId).orElseThrow();
        var account = accountRepository.findById(accountId).orElseThrow();
        var minOpdate = records.stream().map(r -> r.getOpdate()).min((a, b) -> a.compareTo(b)).orElseThrow();
        var corrections = getCorrections(accountId, minOpdate, null);
        for (var dto : records) {
            if (dto.getId() != null && !dto.isSelected()) {
                var entity = transactionRepository.findById(dto.getId()).orElseThrow();
                if (entity.getParty() == null || entity.getParty().isBlank()) {
                    entity.setParty(dto.getParty());
                }
                if (entity.getDetails() == null || entity.getDetails().isBlank()) {
                    entity.setDetails(dto.getDetails());
                }
                entity.setOwner(owner);
                entity.setUpdated(LocalDateTime.now());
                transactionRepository.save(entity);
            } else if (dto.isSelected()) {
                var entity = new Transaction();
                entity.setOwner(owner);
                entity.setOpdate(dto.getOpdate());
                if (dto.getType() == TransactionType.EXPENSE) {
                    entity.setAccount(account);
                }
                entity.setDebit(dto.getDebit());
                if (dto.getType() == TransactionType.INCOME) {
                    entity.setRecipient(account);
                }
                entity.setCredit(dto.getCredit());
                entity.setCategory(dto.getCategory());
                if (entity.getCategory() != null) {
                    entity.setCategory(entityManager.find(Category.class, entity.getCategory().getId()));
                }
                entity.setCurrency(dto.getCurrency());
                entity.setParty(dto.getParty());
                entity.setDetails(dto.getDetails());
                entity.setUpdated(LocalDateTime.now());
                entity.setCreated(LocalDateTime.now());
                transactionRepository.save(entity);
                corrections.stream().filter(c -> c.getOpdate().isAfter(dto.getOpdate()))
                        .forEach(correction -> updateCorrection(correction, accountId,
                                dto.getType() == TransactionType.EXPENSE ? dto.getDebit() : -dto.getCredit()));
            }
        }
        corrections.stream().filter(c -> c.getCredit() == 0 && c.getDebit() == 0)
                .forEach(c -> transactionRepository.delete(c));
    }

    private void dto2entity(TransactionDto dto, Transaction entity) {
        entity.setOpdate(dto.opdate());
        if (dto.account() != null) {
            entity.setAccount(accountRepository.findById(dto.account().id()).orElseThrow());
        }
        entity.setDebit(dto.debit());
        if (dto.recipient() != null) {
            entity.setRecipient(accountRepository.findById(dto.recipient().id()).orElseThrow());
        }
        entity.setCredit(dto.credit());
        entity.setCategory(dto.category());
        entity.setCurrency(dto.currency());
        entity.setParty(dto.party());
        entity.setDetails(dto.details());
        entity.setUpdated(LocalDateTime.now());
        if (entity.getCategory() != null) {
            if (entity.getCategory().getId() == null) {
                entity.getCategory().setOwnerId(entity.getOwner().getId());
                entity.getCategory().setUpdated(LocalDateTime.now());
                entity.getCategory().setCreated(LocalDateTime.now());
            } else {
                entity.setCategory(entityManager.find(Category.class, entity.getCategory().getId()));
            }
        }
    }

    private void updateCorrections(Long accountId, Double amount, LocalDateTime opdate, Long id, Boolean removeZeros) {
        var corrections = getCorrections(accountId, opdate, id);
        for (var correction : corrections) {
            updateCorrection(correction, accountId, amount);
            if (removeZeros && correction.getCredit() == 0 && correction.getDebit() == 0) {
                transactionRepository.delete(correction);
            }
        }
    }

    private void updateCorrection(Transaction correction, Long accountId, Double amount) {
        if (correction.getAccount() != null && correction.getAccount().getId().equals(accountId)) {
            correction.setCredit(correction.getCredit() - amount);
            correction.setDebit(correction.getDebit() - amount);
            if (correction.getCredit() < 0) {
                correction.setCredit(-correction.getCredit());
                correction.setDebit(-correction.getDebit());
                correction.setRecipient(correction.getAccount());
                correction.setAccount(null);
            }
        } else if (correction.getRecipient() != null && correction.getRecipient().getId().equals(accountId)) {
            correction.setCredit(correction.getCredit() + amount);
            correction.setDebit(correction.getDebit() + amount);
            if (correction.getCredit() < 0) {
                correction.setCredit(-correction.getCredit());
                correction.setDebit(-correction.getDebit());
                correction.setAccount(correction.getRecipient());
                correction.setRecipient(null);
            }
        }
    }

    private List<Transaction> getCorrections(Long accountId, LocalDateTime opdate, Long id) {
        var builder = entityManager.getCriteriaBuilder();
        var criteriaQuery = builder.createQuery(Transaction.class);
        var root = criteriaQuery.from(Transaction.class);
        var where = builder.or(builder.equal(root.get("account").get("id"), accountId),
                builder.equal(root.get("recipient").get("id"), accountId));
        where = builder.and(builder.equal(root.get("category").get("id"), 3L), where);
        if (id != null) {
            where = builder.and(where, builder.or(builder.greaterThan(root.<LocalDateTime>get("opdate"), opdate),
                    builder.and(builder.equal(root.<LocalDateTime>get("opdate"), opdate),
                            builder.greaterThan(root.get("id"), id))));
        } else {
            where = builder.and(where, builder.greaterThan(root.<LocalDateTime>get("opdate"), opdate));
        }
        criteriaQuery = criteriaQuery.where(where).orderBy(builder.asc(root.get("opdate")),
                builder.asc(root.get("id")));
        var typedQuery = entityManager.createQuery(criteriaQuery);
        return typedQuery.getResultList();
    }

    private List<Transaction> queryTransactions(Long userId, int offset, int limit, Collection<Long> accountIds,
            String search, LocalDateTime from, LocalDateTime to) {
        var ai = accountIds.isEmpty() ? aclService.findAccounts(userId).map(a -> a.getId()).toList()
                : new ArrayList<>(accountIds);
        var builder = entityManager.getCriteriaBuilder();
        var criteriaQuery = builder.createQuery(Transaction.class);
        var root = criteriaQuery.from(Transaction.class);
        var where = builder.or(root.get("account").get("id").in(ai), root.get("recipient").get("id").in(ai));
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toUpperCase() + "%";
            var details = builder.like(builder.upper(root.get("details")), pattern);
            var party = builder.like(builder.upper(root.get("party")), pattern);
            var category = builder.like(builder.upper(root.join("category", JoinType.LEFT).get("name")), pattern);
            where = builder.and(where, builder.or(category, details, party));
        }
        if (from != null) {
            where = builder.and(where, builder.greaterThanOrEqualTo(root.get("opdate"), from));
        }
        if (to != null) {
            where = builder.and(where, builder.lessThan(root.get("opdate"), to));
        }
        criteriaQuery = criteriaQuery.where(where).orderBy(builder.desc(root.get("opdate")),
                builder.desc(root.get("id")));
        var typedQuery = entityManager.createQuery(criteriaQuery);
        if (offset > 0) {
            typedQuery = typedQuery.setFirstResult(offset);
        }
        if (limit > 0) {
            typedQuery = typedQuery.setMaxResults(limit);
        }
        var trx = typedQuery.getResultList();
        return trx;
    }

    private ImportDto csv2trx(Long bankId, CSVRecord r) {
        if (bankId == 1) {
            var type = "D".equals(r.get(7)) ? TransactionType.EXPENSE : TransactionType.INCOME;
            var opdate = LocalDate.parse(r.get(2), DateTimeFormatter.ISO_DATE).atStartOfDay();
            var debit = Math.abs(Double.parseDouble(r.get(8)));
            var credit = debit;
            var currency = r.get(13);
            var party = r.get(4);
            var details = r.get(11);
            return new ImportDto(null, opdate, type, debit, credit, null, currency, party, details, true);
        } else if (bankId == 2) {
            NumberFormat nf = NumberFormat.getInstance(Locale.FRANCE);
            try {
                var debit = nf.parse(r.get(4)).doubleValue();
                var credit = debit;
                var type = debit < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
                var opdate = LocalDateTime.parse(r.get(0), DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"));
                var currency = r.get(5);
                var party = r.get(11);
                var details = r.get(9);
                return new ImportDto(null, opdate, type, Math.abs(debit), Math.abs(credit), null, currency, party,
                        details,
                        true);
            } catch (ParseException e) {
                throw (new NumberFormatException());
            }
        }
        throw (new IllegalArgumentException());
    }
}
