package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

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
    static Dump dump1 = null;
    static Dump dump2 = null;

    @Autowired
    DataService dataService;
    @Autowired
    EntityManager em;
    private final User user1 = new User(null, "test1@gmail.com", "{noop}123456", true, "test1", "EUR",
            LocalDateTime.now(), LocalDateTime.now(), "test1");
    private final User user2 = new User(null, "test2@gmail.com", "{noop}123456", true, "test2", "EUR",
            LocalDateTime.now(), LocalDateTime.now(), "test2");

    @BeforeAll
    static void initAll() throws ClassNotFoundException, StreamReadException, DatabindException, IOException {
        var cls = Class.forName("com.swarmer.finance.services.DataServiceTest");
        var objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        dump1 = objectMapper.readValue(cls.getClassLoader().getResourceAsStream("test1.json"), Dump.class);
        dump2 = objectMapper.readValue(cls.getClassLoader().getResourceAsStream("test2.json"), Dump.class);
    }

    @BeforeEach
    void init() throws StreamReadException, DatabindException, IOException {
        em.persist(user1);
        em.persist(user2);
        em.flush();
        var userIds = Map.of(dump1.ownerId(), user1.getId(), dump2.ownerId(), user2.getId());
        dump1 = Dump.mapUsers(dump1, userIds);
        dump2 = Dump.mapUsers(dump2, userIds);
    }

    @Test
    void testGetDump() {
        dataService.loadDump(user1.getId(), new Dump(user1.getId(), dump1.created(), dump1.groups(), dump1.categories(),
                dump1.transactions(), dump1.rules()));
        var copy = dataService.getDump(user1.getId());
        assertThat(copy).isNotNull();
        assertThat(copy.ownerId()).isEqualTo(user1.getId());
        assertThat(copy.groups()).hasSize(dump1.groups().size());
        assertThat(copy.transactions()).hasSize(dump1.transactions().size());
        assertThat(copy.categories()).hasSameElementsAs(dump1.categories());
        assertThat(copy.rules()).hasSameElementsAs(dump1.rules());
    }

    @Test
    void testLoadDumpSameUser() {
        dataService.loadDump(user1.getId(), new Dump(user1.getId(), dump1.created(), dump1.groups(), dump1.categories(),
                dump1.transactions(), dump1.rules()));
    }

    @Test
    void testLoadDumpOtherUser() {
        dataService.loadDump(user1.getId(), new Dump(user2.getId(), dump1.created(), dump1.groups(), dump1.categories(),
                dump1.transactions(), dump1.rules()));
    }
}
