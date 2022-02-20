from datetime import datetime
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session
from sqlalchemy.sql import label, expression

from .models.transaction import Transaction
from .models.category import Category
from .models.account import Account, AccountGroup, ACL

def get_balances(db: Session, ai, tid = None, opdate = None):
    query = db.query(Transaction.account_id, Transaction.recipient_id, \
            label('debit', func.sum(Transaction.debit)), label('credit', func.sum(Transaction.credit))) \
            .filter(or_(Transaction.account_id.in_(ai), Transaction.recipient_id.in_(ai)))
    if tid and opdate:
        query = query.filter(or_(Transaction.opdate < opdate, and_(Transaction.opdate == opdate, Transaction.id < tid)))
    return query.group_by(Transaction.account_id, Transaction.recipient_id).all()

def get_groups(db: Session, user_id: int):
    u_groups = db.query(AccountGroup).filter(AccountGroup.owner_id == user_id).order_by(AccountGroup.id).all()
    for group in u_groups:
        group.current_user_id = user_id
    s_groups = [au.group for au in db.query(ACL).filter(ACL.user_id == user_id).order_by(ACL.group_id).all()]
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

def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 50, \
        account_ids = [], category_ids = [], \
        start: datetime = None, finish: datetime = None, shared: bool = False):
    # select accounts
    user_accounts = db.query(Account).join(Account.group).filter(AccountGroup.owner_id == user_id).all()
    user_permissions = db.query(ACL).filter(ACL.user_id == user_id).all()
    accounts = user_accounts +  [a for p in user_permissions for a in p.group.accounts]
    for group in [a.group for a in accounts]:
        group.current_user_id = user_id
    for account in accounts:
        account.balance = account.start_balance
        
    if not any(account_ids):
        account_ids = [a.id for a in accounts if (a.group.is_owner or a.group.is_coowner or a.group.is_shared) and (shared or not a.group.is_shared)]
    
    # get transactions
    transactions = db.query(Transaction)
    if start:
        transactions = transactions.filter(Transaction.opdate>=start)
    if finish:
        transactions = transactions.filter(Transaction.opdate<=finish)
    if category_ids == [0]:
        transactions = transactions.filter(Transaction.account_id.isnot(None)).filter(Transaction.recipient_id.isnot(None))
    elif category_ids == [1]:
        transactions = transactions.filter(Transaction.account_id.isnot(None)).filter(Transaction.recipient_id.is_(None))
    elif category_ids == [2]:
        transactions = transactions.filter(Transaction.account_id.is_(None)).filter(Transaction.recipient_id.isnot(None))
    elif category_ids:
        transactions = transactions.filter(Transaction.category_id.in_(category_ids))
    transactions = transactions.filter(or_(Transaction.account_id.in_(account_ids), Transaction.recipient_id.in_(account_ids))) \
        .order_by(Transaction.opdate.desc(), Transaction.id.desc()) \
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
            if t.recipient and t.recipient.id in account_balances:
                account_balances[t.recipient.id] += t.debit
                t.recipient.balance = account_balances[t.recipient.id]
    return transactions

def get_user_categories(db: Session, user_id: int):
    a_au = [au.group.owner_id for au in db.query(ACL).filter(ACL.user_id == user_id).all()]
    a_au += [au.user_id for au in db.query(ACL).join(ACL.group).filter(AccountGroup.owner_id == user_id).all()]
    a_au.append(user_id)
    all_categories = db.query(Category).filter(Category.owner_id.in_(a_au)).all()
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

