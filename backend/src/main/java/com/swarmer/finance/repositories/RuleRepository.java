package com.swarmer.finance.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.ConditionType;
import com.swarmer.finance.models.Rule;

public interface RuleRepository extends CrudRepository<Rule, Long> {
    List<Rule> findAllByOwnerId(Long ownerId);

    long removeByOwnerId(Long ownerId);

    @Modifying
    @Query(value = "insert into rules (id, owner_id, condition_type, condition_value, category_id, created, updated) values (?1, ?2, ?3, ?4, ?5, ?6, ?7)", nativeQuery = true)
    void insertRuleWithId(Long id, Long ownerId, ConditionType conditionType, String conditionValue,
            Long category_id, LocalDateTime created, LocalDateTime updated);
}
