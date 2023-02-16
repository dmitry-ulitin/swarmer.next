package com.swarmer.finance.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.swarmer.finance.models.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    boolean existsByAccountIdOrRecipientId(Long accountId, Long recipientId);

    @Modifying
    @Query("update transactions t set t.category.id = ?2 where t.category.id = ?1")
    int replaceCategoryId(Long categoryId, Long replaceId);
}
