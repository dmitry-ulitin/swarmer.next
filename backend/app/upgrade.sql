alter table account_users rename to acl;
alter table acl rename column admin to is_admin;
alter table acl rename column write to is_readonly;
alter table acl drop column "order";
alter table users rename column password to hashed_password;
alter table users add column is_active BOOLEAN;
update users set is_active=1;
alter table accounts drop column "order";
alter table categories rename column user_id to owner_id;
insert into categories (id,name, bg,created,updated) values (3,'Correction', '#ffffff','2019-02-28 00:00:00.000000','2019-02-28 22:46:52.887517');

alter table account_groups rename column user_id to owner_id;
CREATE TABLE account_groups2 (
        id INTEGER NOT NULL, 
        owner_id INTEGER NOT NULL, 
        created DATETIME NOT NULL, 
        updated DATETIME NOT NULL, 
        name VARCHAR(255) NOT NULL, 
        deleted BOOLEAN NOT NULL, 
        PRIMARY KEY (id), 
        FOREIGN KEY(owner_id) REFERENCES users (id), 
        CHECK (deleted IN (0, 1))
);
insert into account_groups2 select id,owner_id,created,updated,name,deleted from account_groups;
drop table account_groups;
alter table account_groups2 rename to account_groups;

alter table transactions rename column user_id to owner_id;
alter table transactions add column party VARCHAR(255);
CREATE TABLE transactions2 (
        id INTEGER NOT NULL, 
        owner_id INTEGER NOT NULL, 
        created DATETIME NOT NULL, 
        updated DATETIME NOT NULL, 
        opdate DATETIME NOT NULL, 
        account_id INTEGER, 
        debit NUMERIC(10, 2) NOT NULL, 
        recipient_id INTEGER, 
        credit NUMERIC(10, 2) NOT NULL, 
        category_id INTEGER, 
        currency VARCHAR(5), 
        party VARCHAR(255), 
        details VARCHAR(1024), 
        PRIMARY KEY (id), 
        FOREIGN KEY(owner_id) REFERENCES users (id), 
        FOREIGN KEY(account_id) REFERENCES accounts (id), 
        FOREIGN KEY(recipient_id) REFERENCES accounts (id), 
        FOREIGN KEY(category_id) REFERENCES categories (id)
);
insert into transactions2 select id,owner_id,created,updated,opdate,account_id,credit,recipient_id,debit,category_id,currency,party,details from transactions;
drop table transactions;
alter table transactions2 rename to transactions;
