from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    ForeignKey
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./eco.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# ==========================
# USERS TABLE
# ==========================
class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    city = Column(String)

    points = Column(Integer, default=0)

    reports_count = Column(Integer, default=0)

    garbage_reported = Column(Float, default=0)

# ==========================
# REPORTS TABLE
# ==========================
class Report(Base):

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    image_path = Column(String)

    plastic = Column(Float)

    metal = Column(Float)

    organic = Column(Float)

    location = Column(String)

Base.metadata.create_all(bind=engine)

print("Database Created Successfully")