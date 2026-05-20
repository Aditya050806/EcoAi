from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float

from sqlalchemy.orm import sessionmaker

# ==========================
# DATABASE URL
# ==========================
DATABASE_URL = "sqlite:///./eco.db"

# ==========================
# ENGINE
# ==========================
engine = create_engine(

    DATABASE_URL,

    connect_args={"check_same_thread": False}

)

# ==========================
# SESSION
# ==========================
SessionLocal = sessionmaker(

    autocommit=False,

    autoflush=False,

    bind=engine

)

# ==========================
# BASE
# ==========================
Base = declarative_base()

# ==========================
# USER TABLE
# ==========================
class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    city = Column(String)

    points = Column(Integer, default=0)

    reports = Column(Integer, default=0)

    garbage = Column(Integer, default=0)

# ==========================
# REPORT TABLE
# ==========================
class Report(Base):

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer)

    image_path = Column(String)

    plastic = Column(Float)

    metal = Column(Float)

    organic = Column(Float)

    latitude = Column(String)

    longitude = Column(String)

    location = Column(String)

    status = Column(String, default="Pending")

# ==========================
# CREATE DATABASE
# ==========================
Base.metadata.create_all(bind=engine)

print("Database Created Successfully")