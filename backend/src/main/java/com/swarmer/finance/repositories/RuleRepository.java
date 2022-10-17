package com.swarmer.finance.repositories;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.swarmer.finance.models.Rule;

public interface RuleRepository extends CrudRepository<Rule, Long> {
    List<Rule> findByOwnerId(Long ownerId);
}
