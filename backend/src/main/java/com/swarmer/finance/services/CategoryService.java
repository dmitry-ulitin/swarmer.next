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
        var categories = categoryRepository
                .findByOwnerIdIsNullOrOwnerIdInOrderById(coowners.stream().distinct().toList())
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
        var categories = categoryRepository
                .findByOwnerIdIsNullOrOwnerIdInOrderById(coowners.stream().distinct().toList())
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
        if (category.getId() != null) {
            Category original = categoryRepository.findById(category.getId()).orElseThrow();
            if (original.getParentId() == null || original.getOwnerId().equals(userId)) {
                return original;
            }
        }
        var parent = getCategory(categoryRepository.findById(category.getParentId()).orElseThrow(), userId);
        var existing = categoryRepository
                .findByOwnerIdAndParentIdAndNameIgnoreCase(userId, parent.getId(), category.getName()).orElse(null);
        if (existing != null) {
            return existing;
        }
        return categoryRepository.save(new Category(null, userId, parent.getId(), parent, category.getName(),
                LocalDateTime.now(), LocalDateTime.now()));
    }

    public Category saveCategory(Category category, Long userId) {
        Category original = getCategory(category, userId);
        original.setName(category.getName());
        original.setUpdated(LocalDateTime.now());
        return categoryRepository.save(original);
    }

    public void deleteCategory(Long id, Long replaceId, Long userId) {
        var category = categoryRepository.findById(id).orElseThrow();
        if (category.getOwnerId() == null || !category.getOwnerId().equals(userId)) {
            return;
        }
        if (replaceId == null) {
            replaceId = category.getParentId();
        }
        Category replace = getCategory(categoryRepository.findById(replaceId).orElseThrow(), userId);
        replaceId = replace.getParentId() == null ? null : replace.getId();
        transactionRepository.replaceCategoryId(id, replaceId);
        categoryRepository.delete(category);
    }
}
