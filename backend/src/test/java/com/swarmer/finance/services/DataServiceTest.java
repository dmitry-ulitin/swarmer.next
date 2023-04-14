package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;

import java.io.IOException;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.TestPropertySource;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.swarmer.finance.dto.Dump;
import com.swarmer.finance.models.User;

import jakarta.persistence.EntityManager;

@DataJpaTest(showSql = true, includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
        DataService.class }))
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public class DataServiceTest {
    static Dump dump = null;

    @Autowired
    DataService dataService;
    @Autowired
    EntityManager entityManager;
    private final User user1 = new User(null, "test1@gmail.com", "{noop}123456", true, "test1", "EUR",
            LocalDateTime.now(), LocalDateTime.now(), "test1");
    private final User user2 = new User(null, "test2@gmail.com", "{noop}123456", true, "test2", "EUR",
            LocalDateTime.now(), LocalDateTime.now(), "test2");

    @BeforeAll
    static void initAll() throws ClassNotFoundException, StreamReadException, DatabindException, IOException {
        var cls = Class.forName("com.swarmer.finance.services.DataServiceTest");
        var is = cls.getClassLoader().getResourceAsStream("export_2023-03-29T14_09.json");
        var objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        dump = objectMapper.readValue(is, Dump.class);
    }

    @BeforeEach
    void init() throws StreamReadException, DatabindException, IOException {
        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();
    }

    @Test
    void testGetDump() {
        dataService.loadDump(user1.getId(), new Dump(user1.getId(), dump.created(), dump.groups(), dump.categories(),
                dump.transactions(), dump.rules()));
        var copy = dataService.getDump(user1.getId());
        assertThat(copy).isNotNull();
        assertThat(copy.ownerId()).isEqualTo(user1.getId());
        assertThat(copy.groups()).hasSize(dump.groups().size());
        assertThat(copy.transactions()).hasSize(dump.transactions().size());
        assertThat(copy.categories()).hasSameElementsAs(dump.categories());
        assertThat(copy.rules()).hasSameElementsAs(dump.rules());
    }

    @Test
    void testLoadDumpSameUser() {
        dataService.loadDump(user1.getId(), new Dump(user1.getId(), dump.created(), dump.groups(), dump.categories(),
                dump.transactions(), dump.rules()));
    }

    @Test
    void testLoadDumpOtherUser() {
        dataService.loadDump(user1.getId(), new Dump(user2.getId(), dump.created(), dump.groups(), dump.categories(),
                dump.transactions(), dump.rules()));
    }
}
