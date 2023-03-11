package com.swarmer.finance.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.dto.DumpGroup;
import com.swarmer.finance.dto.DumpCategory;
import com.swarmer.finance.dto.DumpTransaction;
import com.swarmer.finance.models.Category;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.GroupRepository;
import com.swarmer.finance.repositories.TransactionRepository;
import com.swarmer.finance.repositories.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class DataService {
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public DataService(UserRepository userRepository, GroupRepository groupRepository,
            CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public Dump getDump(Long userId) {
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdInOrderById(List.of(userId)).stream().filter(c -> c.getOwnerId() != null).map(DumpCategory::from).toList();
        var groups = groupRepository.findAllByOwnerId(userId).map(DumpGroup::from).toList();
        var transactions = transactionRepository.findAllByOwnerId(userId).map(DumpTransaction::from).toList();
        return new Dump(userId, LocalDateTime.now(), groups, categories, transactions);
    }

    public void loadDump(Long userId, Dump dump) {
        // categories
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdInOrderById(List.of(userId)).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        for (var category : dump.categories()) {
            var existingCategory = categories.get(category.id());
            if (existingCategory == null) {
                categoryRepository.insertCategoryWithId(category.id(), userId, category.parentId(), category.name(), category.created(), category.updated());
                existingCategory = categoryRepository.findById(category.id()).orElseThrow();
                categories.put(category.id(), existingCategory);
            }
        }
    }
}
