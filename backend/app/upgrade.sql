alter table account_users rename to acl;
alter table acl rename column admin to is_admin;
alter table acl rename column write to is_readonly;
alter table acl drop column "order";
alter table users rename column password to hashed_password;
alter table users add column is_active BOOLEAN;
update users set is_active=1;
alter table accounts drop column "order";
alter table transactions rename column user_id to owner_id;
alter table transactions add column party VARCHAR(255);
alter table categories rename column user_id to owner_id;

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
