package com.swarmer.finance.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.swarmer.finance.models.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    boolean existsByAccountIdOrRecipientId(Long accountId, Long recipientId);
}
