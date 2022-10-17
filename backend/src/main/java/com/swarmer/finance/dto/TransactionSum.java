package com.swarmer.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionSum {
    private Long accountId;
    private Long recipientId;
    private Double debit;
    private Double credit;
}
