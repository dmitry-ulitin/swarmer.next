alter table account_users rename to acl
alter table acl rename column admin to is_admin;
alter table acl rename column write to is_readonly;
alter table users add column is_active BOOLEAN;
update users set is_active=1;
alter table account_groups rename column user_id to owner_id;
alter table transactions rename column user_id to owner_id;
alter table categories rename column user_id to owner_id;