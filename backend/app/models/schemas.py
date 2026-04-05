# app/models/schemas.py

from pydantic import BaseModel
from typing import List, Optional, Literal

class TranslationRequest(BaseModel):
    segments: List[str]
    target_lang: str
    source_lang: Optional[str] = "english"
    tone: Optional[str] = "Formal"

class ValidationRequest(BaseModel):
    segments: List[str]

class GlossaryEntryRequest(BaseModel):
    source_lang: str
    target_lang: str
    source_term: str
    target_term: str
    context: Optional[str] = ""

class StyleProfileRequest(BaseModel):
    project_id: str
    tone: str
    style_rules: List[str] = []
    glossary_id: Optional[str] = None

class DocumentTranslationRequest(BaseModel):
    session_id: str
    file_type: str
    segments: List[dict]
    target_lang: str
    source_lang: Optional[str] = "english"
    tone: Optional[str] = "Formal"

class ApprovalRequest(BaseModel):
    user_id: Optional[str] = None
    source_text: str
    corrected_text: str
    target_lang: str
    source_lang: Optional[str] = "en"
    action: Literal["accept", "edit", "reject"] = "accept"

class CreateOrgRequest(BaseModel):
    name: str
    owner_email: str

class JoinOrgRequest(BaseModel):
    code: str
    email: str

class InviteCodeRequest(BaseModel):
    org_id: str
    created_by: str
    expires_hours: int = 168

class RemoveMemberRequest(BaseModel):
    org_id: str
    email: str
    requester_email: str
