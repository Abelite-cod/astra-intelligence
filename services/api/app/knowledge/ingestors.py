"""
Document ingestors — extract clean text from PDF, DOCX, and URLs.
"""
from __future__ import annotations
import io
from typing import Optional


async def ingest_pdf(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages: list[str] = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                pages.append(f"[Page {page_num + 1}]\n{text.strip()}")
        doc.close()
        return "\n\n".join(pages)
    except Exception as e:
        raise RuntimeError(f"PDF ingestion failed for {filename}: {e}") from e


async def ingest_docx(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document

        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        raise RuntimeError(f"DOCX ingestion failed for {filename}: {e}") from e


async def ingest_txt(file_bytes: bytes) -> str:
    """Decode plain text."""
    return file_bytes.decode("utf-8", errors="ignore")


async def ingest_url(url: str) -> str:
    """
    Crawl a URL and extract clean text using BeautifulSoup.
    Strips navigation, ads, scripts, and styles.
    """
    try:
        import httpx
        from bs4 import BeautifulSoup

        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (compatible; AstraBot/1.0; "
                        "+https://astra-intelligence.com)"
                    )
                },
            )
            response.raise_for_status()
            html = response.text

        soup = BeautifulSoup(html, "html.parser")

        # Remove noise elements
        for tag in soup(["script", "style", "nav", "footer", "header",
                          "aside", "iframe", "noscript", "form"]):
            tag.decompose()

        # Extract title
        title = soup.title.string.strip() if soup.title else ""

        # Extract main content — prefer <main> or <article>
        main = soup.find("main") or soup.find("article") or soup.find("body")
        text = main.get_text(separator="\n", strip=True) if main else ""

        # Clean up excessive blank lines
        lines = [line.strip() for line in text.splitlines()]
        cleaned = "\n".join(line for line in lines if line)

        return f"{title}\n\n{cleaned}" if title else cleaned

    except Exception as e:
        raise RuntimeError(f"URL ingestion failed for {url}: {e}") from e


async def ingest_file(
    file_bytes: bytes,
    filename: str,
    content_type: str = "",
) -> str:
    """Route to the correct ingestor based on file type."""
    fname = filename.lower()
    ctype = content_type.lower()

    if fname.endswith(".pdf") or "pdf" in ctype:
        return await ingest_pdf(file_bytes, filename)
    elif fname.endswith(".docx") or "wordprocessingml" in ctype:
        return await ingest_docx(file_bytes, filename)
    elif fname.endswith(".txt") or "text/plain" in ctype:
        return await ingest_txt(file_bytes)
    elif fname.endswith(".md"):
        return await ingest_txt(file_bytes)
    else:
        # Attempt plain text fallback
        return file_bytes.decode("utf-8", errors="ignore")
