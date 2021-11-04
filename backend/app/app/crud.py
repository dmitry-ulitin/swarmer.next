from sqlalchemy.orm import Session
from .models.account import AccountGroup, ACL

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
    return all_groups
