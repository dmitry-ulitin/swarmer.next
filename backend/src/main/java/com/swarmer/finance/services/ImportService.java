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
import java.util.List;
import java.util.Locale;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.ImportDto;
import com.swarmer.finance.dto.RuleDto;
import com.swarmer.finance.models.BankType;
import com.swarmer.finance.models.ConditionType;
import com.swarmer.finance.models.Rule;
import com.swarmer.finance.models.TransactionType;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.RuleRepository;

@Service
public class ImportService {
    private final TransactionService transactionService;
    private final CategoryRepository categoryRepository;
    private final RuleRepository ruleRepository;

    public ImportService(TransactionService transactionService, CategoryRepository categoryRepository, RuleRepository ruleRepository) {
        this.transactionService = transactionService;
        this.categoryRepository = categoryRepository;
        this.ruleRepository = ruleRepository;
    }

    public List<RuleDto> getRules(Long userId) {
        return ruleRepository.findByOwnerId(userId).stream().map(r -> RuleDto.from(r)).toList();
    }

    public RuleDto getRuleById(Long ruleId, Long userId) {
        return ruleRepository.findById(ruleId).map(r -> RuleDto.from(r)).orElse(null);
    }

    public RuleDto addRule(RuleDto rule, Long userId) {
        var entity = new Rule();
        entity.setOwnerId(userId);
        entity.setConditionType(rule.conditionType());
        entity.setConditionValue(rule.conditionValue());
        entity.setCategory(categoryRepository.findById(rule.category().getId()).orElseThrow());
        entity.setCreated(LocalDateTime.now());
        entity.setUpdated(LocalDateTime.now());
        return RuleDto.from(ruleRepository.save(entity));
    }

    public RuleDto updateRule(RuleDto rule, Long userId) {
        var entity = ruleRepository.findById(rule.id()).orElseThrow();
        entity.setConditionType(rule.conditionType());
        entity.setConditionValue(rule.conditionValue());
        entity.setCategory(categoryRepository.findById(rule.category().getId()).orElseThrow());
        entity.setUpdated(LocalDateTime.now());
        return RuleDto.from(ruleRepository.save(entity));
    }

    public List<ImportDto> importFile(InputStream is, BankType bankId, Long accountId, Long userId)
            throws IOException {
        var format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true)
                .setTrim(true).build();
        if (bankId == BankType.TINKOFF) {
            format = format.builder().setDelimiter(';').build();
        }
        try (var fileReader = new BufferedReader(new InputStreamReader(is, bankId == BankType.TINKOFF ? "cp1251" : "UTF-8"));
                var csvParser = new CSVParser(fileReader, format)) {
            var records = csvParser.getRecords().stream().map(r -> csv2trx(bankId, r)).toList();
            var minOpdate = records.stream().map(r -> r.getOpdate()).min((a, b) -> a.compareTo(b)).orElseThrow();
            var trx = transactionService.queryTransactions(userId, List.of(accountId), null, null, minOpdate, null, 0, 0);
            var rules = ruleRepository.findByOwnerId(userId);

            return records.stream().map(r -> {
                var rule = rules
                        .stream().filter(rl -> rl.getCategory().getType().equals(r.getType())
                                && rl.getConditionType() == ConditionType.PARTY_EQUALS
                                && rl.getConditionValue().equals(r.getParty()))
                        .findFirst().orElse(null);
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getCategory().getType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.DETAILS_EQUALS
                                    && rl.getConditionValue().equals(r.getDetails()))
                            .findFirst().orElse(null);
                }
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getCategory().getType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.PARTY_CONTAINS && r.getParty() != null
                                    && r.getParty().toLowerCase().contains(rl.getConditionValue().toLowerCase()))
                            .findFirst().orElse(null);
                }
                if (rule == null) {
                    rule = rules
                            .stream().filter(rl -> rl.getCategory().getType().equals(r.getType())
                                    && rl.getConditionType() == ConditionType.DETAILS_CONTAINS && r.getDetails() != null
                                    && r.getDetails().toLowerCase().contains(rl.getConditionValue().toLowerCase()))
                            .findFirst().orElse(null);
                }
                if (rule != null) {
                    r.setRule(RuleDto.from(rule));
                    r.setCategory(rule.getCategory());
                }
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
                }
                return r;
            }).toList();
        }
    }

    private ImportDto csv2trx(BankType bankId, CSVRecord r) {
        if (bankId == BankType.LHV) {
            var type = "D".equals(r.get(7)) ? TransactionType.EXPENSE : TransactionType.INCOME;
            var opdate = LocalDate.parse(r.get(2), DateTimeFormatter.ISO_DATE).atStartOfDay();
            var debit = Math.abs(Double.parseDouble(r.get(8)));
            var credit = debit;
            var currency = r.get(13);
            var party = r.get(4);
            var details = r.get(11);
            return new ImportDto(null, opdate, type, debit, credit, null, null, currency, party, details, true);
        } else if (bankId == BankType.TINKOFF) {
            NumberFormat nf = NumberFormat.getInstance(Locale.FRANCE);
            try {
                var debit = nf.parse(r.get(4)).doubleValue();
                var credit = debit;
                var type = debit < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
                var opdate = LocalDateTime.parse(r.get(0), DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"));
                var currency = r.get(5);
                var party = r.get(11);
                var details = r.get(9);
                return new ImportDto(null, opdate, type, Math.abs(debit), Math.abs(credit), null, null, currency, party,
                        details,
                        true);
            } catch (ParseException e) {
                throw (new NumberFormatException());
            }
        }
        throw (new IllegalArgumentException());
    }
}
