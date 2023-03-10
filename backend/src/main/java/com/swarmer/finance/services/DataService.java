package com.swarmer.finance.services;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.dto.DumpGroup;
import com.swarmer.finance.dto.DumpCategory;
import com.swarmer.finance.dto.DumpTransaction;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.TransactionRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class DataService {
    private final GroupRepository groupRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public DataService(GroupRepository groupRepository, CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.groupRepository = groupRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public Dump getDump(Long userId) {
        var categories = categoryRepository.findAllByOwnerId(userId).map(DumpCategory::from).toList();
        var groups = groupRepository.findAllByOwnerId(userId).map(DumpGroup::from).toList();
        var transactions = transactionRepository.findAllByOwnerId(userId).map(DumpTransaction::from).toList();
        return new Dump(userId, LocalDateTime.now(), groups, categories, transactions);
    }
}
