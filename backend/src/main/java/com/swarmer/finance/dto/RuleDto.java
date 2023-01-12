package com.swarmer.finance.dto;

import com.swarmer.finance.models.Category;
import com.swarmer.finance.models.ConditionType;
import com.swarmer.finance.models.TransactionType;

public record RuleDto(Long id, TransactionType transactionType, ConditionType conditionType,
        String conditionValue, Category category) {
    public static RuleDto from(com.swarmer.finance.models.Rule rule) {
        return new RuleDto(rule.getId(), rule.getTransactionType(), rule.getConditionType(),
                rule.getConditionValue(), rule.getCategory());
    }
}
