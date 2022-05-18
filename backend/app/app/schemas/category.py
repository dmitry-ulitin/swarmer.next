from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    fullname: str
    level: int
    root_id: int = None

    class Config:
        orm_mode = True
