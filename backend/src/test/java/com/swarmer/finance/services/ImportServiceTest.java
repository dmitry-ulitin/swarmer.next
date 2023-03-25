package com.swarmer.finance.services;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swarmer.finance.dto.ImportDto;
import com.swarmer.finance.models.Account;
import com.swarmer.finance.models.AccountGroup;
import com.swarmer.finance.models.BankType;
import com.swarmer.finance.models.Transaction;
import com.swarmer.finance.models.User;
import com.swarmer.finance.repositories.RuleRepository;

@ExtendWith(MockitoExtension.class)
public class ImportServiceTest {
    @Mock
    TransactionService transactionService;
    @Mock
    RuleRepository ruleRepository;
    @InjectMocks
    ImportService importService;

    @Test
    void testImportFile() {
        var lhv = """
                \"Customer account no\",\"Document no\",\"Date\",\"Sender/receiver account\",\"Sender/receiver name\",\"Sender bank code\",\"Empty\",\"Debit/Credit (D/C)\",\"Amount\",\"Reference number\",\"Archiving code\",\"Description\",\"Fee\",\"Currency\",\"Personal code or register code\",\"Sender/receiver bank BIC\",\"Ultimate debtor name\",\"Transaction reference\",\"Account servicer reference\"
                \"EE657700771007633864\",\"\",2022-09-01,\"\",\"ONEAL'S\",,,\"D\",-80.95,\"\",\"\",\"(..4989) 2022-08-30 13:31 ONEAL'S \\JOHN F. KENNEDY INT'L AI \\QUEENS \\11430 NY USA (80.00 USD, conversion fee 0.80 EUR, rate 1.001875)\",0.00,\"EUR\",\"\",\"\",\"\",\"575297652\",\"3BF05059AC29ED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-01,\"\",\"STOCKMANN TALLINN\",,,\"D\",-80.43,\"\",\"\",\"(..4989) 2022-08-31 15:49 STOCKMANN TALLINN \\LIIVALAIA 53 \\TALLINN \\10145 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"575600291\",\"0D0B6D51CD29ED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-02,\"\",\"RISTIKU SELVER\",,,\"D\",-3.57,\"\",\"\",\"(..4989) 2022-09-01 11:08 RISTIKU SELVER \\TELLISKIVI 24 \\TALLINN \\80035 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"575904504\",\"45CA2D46972AED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-05,\"\",\"\",,,\"C\",0.31,\"\",\"\",\"Interest received (2022-08-01 - 2022-08-31, Interest rate 0.01%)\",0.00,\"EUR\",\"\",\"\",\"\",\"577253218\",\"1C7C90A9C22CED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-05,\"\",\"KAUBAMAJA TALLINN\",,,\"D\",-16.67,\"\",\"\",\"(..4989) 2022-09-04 15:40 KAUBAMAJA TALLINN \\GONSIORI 2/VIRU VALJAK 4/ \\HARJUMAA, TAL\\10143 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577065917\",\"65919889F42CED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-05,\"\",\"KAUPLUS LIVIKO/MERE\",,,\"D\",-75.39,\"\",\"\",\"(..4989) 2022-09-04 15:25 KAUPLUS LIVIKO/MERE \\MERE PST 6 \\TALLINN \\10111 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577061432\",\"48015F02F62CED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-06,\"\",\"CIRCLE K NARVA LINNAPI\",,,\"D\",-2.70,\"\",\"\",\"(..4989) 2022-09-05 14:01 CIRCLE K NARVA LINNAPI\\TALLINNA MNT 64 \\NARVA \\EE 21005 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577519533\",\"C60BB7C4BB2DED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-06,\"\",\"ASTRI SELVERI ISETEENI\",,,\"D\",-1.74,\"\",\"\",\"(..4989) 2022-09-05 14:22 ASTRI SELVERI ISETEENI\\TALLINNA MNT 41 \\IDA-VIRUMAA, \\20605 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577532584\",\"FA63482BBD2DED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-06,\"\",\"WWW.EESTIPIIR.EE\",,,\"D\",-5.70,\"\",\"\",\"(..4989) 2022-09-05 11:38 WWW.EESTIPIIR.EE \\MAEALUSE 2/1 \\3725049680 \\12618 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577417721\",\"A58FF385BE2DED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-06,\"\",\"TORUPILLI SELVER ISETE\",,,\"D\",-16.72,\"\",\"\",\"(..4989) 2022-09-05 11:29 TORUPILLI SELVER ISETE\\VESIVARAVA 37 \\TALLINN \\10126 ESTEST\",0.00,\"EUR\",\"\",\"\",\"\",\"577411340\",\"8AC46DFDBE2DED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-09,\"\",\"GOOGLE*YOUTUBEPREMIUM\",,,\"D\",-3.40,\"\",\"\",\"(..4989) 2022-09-08 09:21 GOOGLE*YOUTUBEPREMIUM\\G.CO/HELPPAY#\\INTERNET\\94043 CA USA (199.00 RUB, conversion fee 0.03 EUR, rate 0.01693467)\",0.00,\"EUR\",\"\",\"\",\"\",\"578905140\",\"8A46B5771730ED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-09,\"\",\"GOOGLE*YOUTUBEPREMIUM\",,,\"D\",-5.11,\"\",\"\",\"(..4989) 2022-09-08 13:01 GOOGLE*YOUTUBEPREMIUM\\G.CO/HELPPAY#\\INTERNET\\94043 CA USA (299.00 RUB, conversion fee 0.05 EUR, rate 0.01692307)\",0.00,\"EUR\",\"\",\"\",\"\",\"579019873\",\"31AD042B1830ED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-09,\"\",\"GOOGLE*YOUTUBEPREMIUM\",,,\"D\",-5.11,\"\",\"\",\"(..4989) 2022-09-08 10:33 GOOGLE*YOUTUBEPREMIUM\\G.CO/HELPPAY#\\INTERNET\\94043 CA USA (299.00 RUB, conversion fee 0.05 EUR, rate 0.01692307)\",0.00,\"EUR\",\"\",\"\",\"\",\"578947261\",\"3E0197BD1B30ED11A2EA00155DA95D0B\"
                \"EE657700771007633864\",\"\",2022-09-10,\"\",\"\",,,\"D\",-1.00,\"\",\"\",\"Card (..4989) monthly fee 08-2022\",0.00,\"EUR\",\"\",\"\",\"\",\"580019524\",\"A842145A1731ED11A2EA00155DA95D0B\"
                """;
        try {
            var userId = 1L;
            var accountId = 1L;
            var user = User.builder().id(userId).name("test").build();
            var bank = AccountGroup.builder().id(1L).name("bank").owner(user).build();
            var account = Account.builder().id(accountId).name("test").currency("EUR").group(bank).build();
            var trx = Transaction.builder().owner(user).opdate(LocalDateTime.of(2022, 9, 1, 0, 0, 0)).account(account)
                    .debit(80.95).credit(80.95).build();
            var list = new ArrayList<Transaction>();
            list.add(trx);

            when(transactionService.queryTransactions(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                    .thenReturn(list);
            when(ruleRepository.findAllByOwnerId(userId)).thenReturn(List.of());

            var actual = importService.importFile(new ByteArrayInputStream(lhv.getBytes()), BankType.LHV, 1L, 1L);
            assertThat(actual).hasSize(14);
            assertThat(actual.get(0).isSelected()).isFalse();
            assertThat(actual.stream().filter(ImportDto::isSelected).toList()).hasSize(13);
        } catch (IOException e) {
            e.printStackTrace();
        }

    }
}
