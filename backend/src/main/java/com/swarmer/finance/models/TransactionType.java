package com.swarmer.finance.models;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TransactionType {
    TRANSFER(0), EXPENSE(1), INCOME(2), CORRECTION(3);
    private final int value;
    private TransactionType(int value) {
        this.value = value;
    }

    @JsonValue
    public int getValue() {
        return value;
    }
}
