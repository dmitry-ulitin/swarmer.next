from datetime import datetime
from locale import currency
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session
from sqlalchemy.sql import label

from .. import models
from .. import schemas

def get_balances(db: Session, ai, tid = None, opdate = None):
    query = db.query(models.Transaction.account_id, models.Transaction.recipient_id, \
            label('debit', func.sum(models.Transaction.debit)), label('credit', func.sum(models.Transaction.credit))) \
            .filter(or_(models.Transaction.account_id.in_(ai), models.Transaction.recipient_id.in_(ai)))
    if tid and opdate:
        query = query.filter(or_(models.Transaction.opdate < opdate, and_(models.Transaction.opdate == opdate, models.Transaction.id < tid)))
    return query.group_by(models.Transaction.account_id, models.Transaction.recipient_id).all()

def get_groups(db: Session, user_id: int):
    u_groups = db.query(models.AccountGroup).filter(models.AccountGroup.owner_id == user_id).order_by(models.AccountGroup.id).all()
    for group in u_groups:
        group.current_user_id = user_id
    s_groups = [au.group for au in db.query(models.ACL).filter(models.ACL.user_id == user_id).order_by(models.ACL.group_id).all()]
    for group in s_groups:
        group.current_user_id = user_id
    all_groups = [g for g in u_groups if g.is_owner]
    all_groups += [g for g in u_groups if g.is_coowner]
    all_groups += [g for g in s_groups if g.is_coowner]
    all_groups += [g for g in s_groups if g.is_shared]
    all_accounts = [a for g in all_groups for a in g.accounts]
    balances = get_balances(db, [a.id for a in all_accounts])
    for group in all_groups:
        for account in group.accounts:
            account.balance = account.start_balance
            account.balance -= sum(list(map(lambda b: b.credit, list(filter(lambda b: b.account_id == account.id, balances)))))
            account.balance += sum(list(map(lambda b: b.debit, list(filter(lambda b: b.recipient_id == account.id, balances)))))
    return all_groups

def get_group(db: Session, user_id: int, id: int):
    group = db.query(models.AccountGroup).get(id)
    group.current_user_id = user_id
    balances = get_balances(db, [a.id for a in group.accounts])
    for account in group.accounts:
        account.balance = account.start_balance
        account.balance -= sum(list(map(lambda b: b.credit, list(filter(lambda b: b.account_id == account.id, balances)))))
        account.balance += sum(list(map(lambda b: b.debit, list(filter(lambda b: b.recipient_id == account.id, balances)))))
    return group

def create_group(db: Session, user_id: int, group: schemas.AccountGroupCreate):
    # add new group
    db_group = models.AccountGroup(owner_id = user_id, name = group.fullname)
    # add accounts
    for account in group.accounts:
        if not account.deleted:
            db_account = models.Account(name = account.name, currency = account.currency, \
                start_balance = account.start_balance if account.start_balance else 0)
            db_group.accounts.append(db_account)
    # add ACL
    for acl in group.permissions:
        db_acl = models.ACL(user_id = acl.user.id, is_readonly = acl.is_readonly, is_admin = acl.is_admin)
        db_group.permissions.append(db_acl)

    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return get_group(db, user_id, db_group.id)

def update_group(db: Session, user_id: int, group: schemas.AccountGroupUpdate):
    db_group = db.query(models.AccountGroup).get(group.id)
    if db_group.owner_id != user_id:
        return False
    db_group.name = group.fullname
    db.commit()
    return get_group(db, user_id, group.id)

def delete_group(db: Session, user_id: int, id: int):
    db_group = db.query(models.AccountGroup).get(id)
    if db_group.owner_id != user_id:
        return False
    db.query(models.AccountGroup).filter(models.AccountGroup.id == id).update({'deleted': True})
    db.commit()
    return True

def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 50, \
        account_ids = [], category_ids = [], \
        start: datetime = None, finish: datetime = None, shared: bool = False):
    # select accounts
    user_accounts = db.query(models.Account).join(models.Account.group).filter(models.AccountGroup.owner_id == user_id).all()
    user_permissions = db.query(models.ACL).filter(models.ACL.user_id == user_id).all()
    accounts = user_accounts +  [a for p in user_permissions for a in p.group.accounts]
    for group in [a.group for a in accounts]:
        group.current_user_id = user_id
    for account in accounts:
        account.balance = account.start_balance
        
    if not any(account_ids):
        account_ids = [a.id for a in accounts if (a.group.is_owner or a.group.is_coowner or a.group.is_shared) and (shared or not a.group.is_shared)]
    
    # get transactions
    transactions = db.query(models.Transaction)
    if start:
        transactions = transactions.filter(models.Transaction.opdate>=start)
    if finish:
        transactions = transactions.filter(models.Transaction.opdate<=finish)
    if category_ids == [0]:
        transactions = transactions.filter(models.Transaction.account_id.isnot(None)).filter(models.Transaction.recipient_id.isnot(None))
    elif category_ids == [1]:
        transactions = transactions.filter(models.Transaction.account_id.isnot(None)).filter(models.Transaction.recipient_id.is_(None))
    elif category_ids == [2]:
        transactions = transactions.filter(models.Transaction.account_id.is_(None)).filter(models.Transaction.recipient_id.isnot(None))
    elif category_ids:
        transactions = transactions.filter(models.Transaction.category_id.in_(category_ids))
    transactions = transactions.filter(or_(models.Transaction.account_id.in_(account_ids), models.Transaction.recipient_id.in_(account_ids))) \
        .order_by(models.Transaction.opdate.desc(), models.Transaction.id.desc()) \
        .limit(limit).offset(skip).all()
    if not category_ids:
        account_balances = dict((a.id,a.start_balance) for a in accounts if a.id in account_ids)
        # get balances for all previous transactions
        balances = get_balances(db, account_ids, transactions[-1].id, transactions[-1].opdate) if len(transactions) else []
        for id in account_balances:
            account_balances[id] -= sum(list(map(lambda b: b.credit, list(filter(lambda b: b.account_id == id, balances)))))
            account_balances[id] += sum(list(map(lambda b: b.debit, list(filter(lambda b: b.recipient_id == id, balances)))))
        # set balances to transactions
        for t in transactions[::-1]:
            if t.account and t.account.id in account_balances:
                account_balances[t.account.id] -= t.credit
                t.account.balance = account_balances[t.account.id]
                t.account_balance = account_balances[t.account.id]
            if t.recipient and t.recipient.id in account_balances:
                account_balances[t.recipient.id] += t.debit
                t.recipient.balance = account_balances[t.recipient.id]
                t.recipient_balance = account_balances[t.recipient.id]
    return transactions

def get_transaction(db: Session, user_id: int, id: int):
    transaction = db.query(models.Transaction).get(id)
    balances = get_balances(db, [a.id for a in [transaction.account,transaction.recipient] if a], transaction.id, transaction.opdate)
    if transaction.account:
        transaction.account.group.current_user_id = user_id
        transaction.account.balance = transaction.account.start_balance
        transaction.account.balance -= sum(list(map(lambda b: b.credit, list(filter(lambda b: b.account_id == transaction.account.id, balances)))))
        transaction.account.balance += sum(list(map(lambda b: b.debit, list(filter(lambda b: b.recipient_id == transaction.account.id, balances)))))
        transaction.account.balance -= transaction.debit
        transaction.account_balance = transaction.account.balance
    if transaction.recipient:
        transaction.recipient.group.current_user_id = user_id
        transaction.recipient.balance = transaction.recipient.start_balance
        transaction.recipient.balance -= sum(list(map(lambda b: b.credit, list(filter(lambda b: b.account_id == transaction.recipient.id, balances)))))
        transaction.recipient.balance += sum(list(map(lambda b: b.debit, list(filter(lambda b: b.recipient_id == transaction.recipient.id, balances)))))
        transaction.recipient.balance += transaction.credit
        transaction.recipient_balance = transaction.recipient.balance
    return transaction

def create_transaction(db: Session, user_id: int, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(owner_id = user_id, opdate = transaction.opdate, \
        details = transaction.details, \
        currency = transaction.currency, \
        category_id = transaction.category.id if transaction.category else None, \
        account_id = transaction.account.id if transaction.account else None, \
        recipient_id = transaction.recipient.id if transaction.recipient else None, \
        credit = transaction.credit, debit = transaction.debit)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return get_transaction(db, user_id, db_transaction.id)

def update_transaction(db: Session, user_id: int, transaction: schemas.TransactionUpdate):
    db_transaction = models.Transaction( \
        id = transaction.id, owner_id = user_id, \
        opdate = transaction.opdate, \
        details = transaction.details, \
        currency = transaction.currency, \
        category_id = transaction.category.id if transaction.category else None, \
        account_id = transaction.account.id if transaction.account else None, \
        recipient_id = transaction.recipient.id if transaction.recipient else None, \
        credit = transaction.credit, debit = transaction.debit)
    db.merge(db_transaction)
    db.commit()
    return get_transaction(db, user_id, db_transaction.id)

def delete_transaction(db: Session, user_id: int, transaction_id: int):
    db.query(models.Transaction).filter(models.Transaction.id == transaction_id).delete()
    db.commit()

def get_user_categories(db: Session, user_id: int):
    a_au = [au.group.owner_id for au in db.query(models.ACL).filter(models.ACL.user_id == user_id).all()]
    a_au += [au.user_id for au in db.query(models.ACL).join(models.ACL.group).filter(models.AccountGroup.owner_id == user_id).all()]
    a_au.append(user_id)
    all_categories = db.query(models.Category).filter(models.Category.owner_id.in_(a_au)).all()
    all_categories = sorted(all_categories, key = lambda c: c.fullpath)
    categories = []
    p = None
    for c in all_categories:
        if p and p.fullpath == c.fullpath:
            if c.owner_id == user_id:
                categories[len(categories) - 1] = c
            continue
        categories.append(c)
        p = c
    return categories

