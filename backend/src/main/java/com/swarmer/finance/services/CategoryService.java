package com.swarmer.finance.services;

import java.util.List;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.models.Category;
import com.swarmer.finance.repositories.CategoryRepository;
import com.swarmer.finance.repositories.TransactionRepository;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final AclService aclService;

    public CategoryService(CategoryRepository categoryRepository, TransactionRepository transactionRepository,
            AclService aclService) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.aclService = aclService;
    }

    public List<Category> getCategories(Long userId) {
        var coowners = aclService.findUsers(userId);
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdIn(coowners.stream().distinct().toList())
                .stream()
                .sorted((c1,
                        c2) -> c1.getType().equals(c2.getType())
                                ? (c1.getLevel() == 0 ? -1
                                        : (c2.getLevel() == 0 ? 1
                                                : c1.getFullName().toLowerCase()
                                                        .compareTo(c2.getFullName().toLowerCase())))
                                : c1.getType().compareTo(c2.getType()))
                .collect(Collectors.toList());
        Category prev = null;
        List<Category> result = new ArrayList<>();
        for (var c : categories) {
            if (prev != null && c.getFullName().toLowerCase().equals(prev.getFullName().toLowerCase())) {
                if (userId.equals(c.getOwnerId())) {
                    result.set(result.size() - 1, c);
                }
                continue;
            }
            result.add(c);
            prev = c;
        }
        return result;
    }

    public List<Long> getCategoriesFilter(Long userId, Long categoryId) {
        List<Long> result = new ArrayList<>();
        if (categoryId == null) {
            return result;
        }
        var coowners = aclService.findUsers(userId);
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdIn(coowners.stream().distinct().toList())
                .stream()
                .sorted((c1,
                        c2) -> c1.getType().equals(c2.getType())
                                ? (c1.getLevel() == 0 ? -1
                                        : (c2.getLevel() == 0 ? 1
                                                : c1.getFullName().toLowerCase()
                                                        .compareTo(c2.getFullName().toLowerCase())))
                                : c1.getType().compareTo(c2.getType()))
                .collect(Collectors.toList());

        int index = 0;
        while (index < categories.size() && !categories.get(index).getId().equals(categoryId))
            index++;
        if (index > categories.size()) {
            result.add(categoryId);
            return result;
        }
        var fullName = categories.get(index).getFullName().toLowerCase();
        while (index > 0 && categories.get(index - 1).getFullName().toLowerCase().equals(fullName))
            index--;
        while (index < categories.size() && (categories.get(index).getFullName().toLowerCase().equals(fullName)
                || categories.get(index).getFullName().toLowerCase().startsWith(fullName + " / ")))
            result.add(categories.get(index++).getId());
        return result;
    }

    public Category getCategory(Category category, Long userId) {
        var original = categoryRepository.findById(category.getId()).orElse(null);
        if (original != null) {
            if (original.getParentId() == null) {
                return original;
            } else if (!original.getOwnerId().equals(userId)) {
                category.setId(null);
                category.setCreated(LocalDateTime.now());
            } else {
                original.setName(category.getName());
                original.setParentId(category.getParentId());
                category = original;
            }
        } else {
            original = categoryRepository
                    .findByOwnerIdAndParentIdAndNameIgnoreCase(userId, category.getParentId(), category.getName())
                    .orElse(null);
            if (original != null) {
                return original;
            }
            category.setId(null);
            category.setCreated(LocalDateTime.now());
        }
        category.setOwnerId(userId);
        var parent = categoryRepository.findById(category.getParentId()).orElseThrow();
        category.setParent(getCategory(parent, userId));
        category.setParentId(category.getParent().getId());
        category.setUpdated(LocalDateTime.now());
        categoryRepository.save(category);
        return category;
    }

    public Category saveCategory(Category category, Long userId) {
        return categoryRepository.save(getCategory(category, userId));
    }

    public void deleteCategory(Long id, Long replaceId, Long userId) {
        var category = categoryRepository.findById(id).orElseThrow();
        if (category.getOwnerId() == null || !category.getOwnerId().equals(userId)) {
            return;
        }
        Category replace = null;
        if (replaceId != null) {
            replace = getCategory(categoryRepository.findById(replaceId).orElseThrow(), userId);
            replaceId = replace.getId();
        }
        transactionRepository.replaceCategoryId(id, replaceId);
        categoryRepository.delete(category);
    }
}
