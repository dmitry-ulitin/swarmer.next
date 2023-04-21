package com.swarmer.finance.repositories;

import java.time.LocalDateTime;
import java.util.stream.Stream;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.swarmer.finance.models.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    boolean existsByAccountIdOrRecipientId(Long accountId, Long recipientId);

    Stream<Transaction> findAllByOwnerId(Long userId);

    @Modifying(clearAutomatically = true)
    @Query("delete from transactions where owner.id = ?1")
    void removeByOwnerId(Long userId);

    @Modifying
    @Query("update transactions t set t.category.id = ?2 where t.category.id = ?1")
    int replaceCategoryId(Long categoryId, Long replaceId);

    @Modifying
    @Query(value = "insert into transactions (id, owner_id, opdate, account_id, debit, recipient_id, credit, category_id, currency, party, details, created, updated) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)", nativeQuery = true)
    void insertTransactionWithId(Long id, Long ownerId, LocalDateTime opdate, Long accountId, double debit,
            Long recipientId, double credit, Long categoryId, String currency, String party, String details,
            LocalDateTime created, LocalDateTime updated);
}
