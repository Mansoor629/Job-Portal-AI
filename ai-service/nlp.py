"""
NLP logic for resume screening (no web framework needed, so it is easy to test).

Pipeline
1. Clean + tokenize text (spaCy if installed, otherwise a regex tokenizer).
2. Extract skills from resume using a skill dictionary.
3. Compare with the job's required skills  -> skill score.
4. TF-IDF cosine similarity between resume and job description -> similarity score.
5. Final score = 70% skill match + 30% text similarity.
"""
import math
import re
from collections import Counter

SKILLS = [
    "java", "python", "javascript", "typescript", "react", "angular", "vue", "node.js", "node",
    "express", "next.js", "mongodb", "mysql", "postgresql", "sql", "nosql", "html", "css",
    "bootstrap", "tailwind", "c++", "c#", "c", "php", "django", "flask", "spring boot", "spring",
    "git", "github", "docker", "kubernetes", "aws", "azure", "linux", "rest api", "graphql",
    "machine learning", "deep learning", "nlp", "data structures", "algorithms", "pandas",
    "numpy", "tensorflow", "pytorch", "scikit-learn", "spacy", "nltk", "power bi", "excel",
    "communication", "teamwork", "leadership", "problem solving",
]

# aliases -> canonical skill name
ALIASES = {
    "nodejs": "node.js", "node js": "node.js", "reactjs": "react", "react.js": "react",
    "expressjs": "express", "express.js": "express", "nextjs": "next.js", "mongo": "mongodb",
    "postgres": "postgresql", "js": "javascript", "ml": "machine learning",
    "natural language processing": "nlp", "dsa": "data structures", "restful": "rest api",
    "rest apis": "rest api", "restful api": "rest api", "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
}

STOPWORDS = set("""a an the and or of to in on for with is are was were be been being as at by from
this that these those it its we you your our their will can should would must have has had not
but if then than so such into about over also etc using use used work working experience
knowledge skills skill candidate looking required requirement responsibilities strong good
ability able""".split())

_nlp = None


def _get_spacy():
    """Load spaCy lazily. Works even if the English model is not downloaded."""
    global _nlp
    if _nlp is not None:
        return _nlp or None
    try:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
        except Exception:
            _nlp = spacy.blank("en")
    except Exception:
        _nlp = False
    return _nlp or None


def _contains(text_lower, phrase):
    pat = r"(?<![\w+#.])" + re.escape(phrase.lower()) + r"(?![\w+#])(?!\.\w)"
    return re.search(pat, text_lower) is not None


def normalize(text):
    t = (text or "").lower()
    for alias, canon in ALIASES.items():
        t = re.sub(r"(?<![\w+#.])" + re.escape(alias) + r"(?![\w+#])(?!\.\w)", canon, t)
    return t


def extract_skills(text):
    t = normalize(text)
    return sorted({s for s in SKILLS if _contains(t, s)})


def tokens(text):
    text = (text or "").lower()
    nlp = _get_spacy()
    if nlp is not None:
        out = []
        for tok in nlp(text):
            if tok.is_alpha and not tok.is_stop and len(tok.text) > 1:
                out.append((tok.lemma_ or tok.text).lower() if tok.lemma_ else tok.text)
        return [w for w in out if w not in STOPWORDS]
    return [w for w in re.findall(r"[a-z][a-z+#.]{1,}", text) if w not in STOPWORDS]


def cosine_similarity(text_a, text_b):
    """TF-IDF cosine similarity between two documents (0..1)."""
    ta, tb = tokens(text_a), tokens(text_b)
    if not ta or not tb:
        return 0.0
    docs = [Counter(ta), Counter(tb)]
    vocab = set(docs[0]) | set(docs[1])
    idf = {w: math.log((1 + 2) / (1 + sum(1 for d in docs if w in d))) + 1 for w in vocab}
    va = {w: docs[0][w] * idf[w] for w in docs[0]}
    vb = {w: docs[1][w] * idf[w] for w in docs[1]}
    dot = sum(va[w] * vb.get(w, 0) for w in va)
    na = math.sqrt(sum(v * v for v in va.values()))
    nb = math.sqrt(sum(v * v for v in vb.values()))
    return dot / (na * nb) if na and nb else 0.0


def analyze(resume, job_description="", job_skills=None):
    resume = resume or ""
    resume_norm = normalize(resume)
    resume_skills = extract_skills(resume)

    # Required skills: those the recruiter typed; else extracted from the description
    required = [str(s).strip().lower() for s in (job_skills or []) if str(s).strip()]
    required = [ALIASES.get(s, s) for s in required]
    if not required:
        required = extract_skills(job_description)
    required = list(dict.fromkeys(required))

    # Match each required skill directly in the resume (works for ANY skill, not just the dictionary)
    matched = [s for s in required if _contains(resume_norm, s)]
    missing = [s for s in required if s not in matched]
    skill_score = (len(matched) / len(required) * 100) if required else 0

    job_text = (job_description or "") + " " + " ".join(required)
    similarity = cosine_similarity(resume, job_text) * 100

    if required:
        score = 0.7 * skill_score + 0.3 * similarity
    else:
        score = similarity
    all_skills = sorted(set(resume_skills) | set(matched))
    return {
        "skills": all_skills,
        "matchedSkills": matched,
        "missingSkills": missing,
        "skillScore": round(skill_score),
        "similarity": round(similarity),
        "score": max(0, min(100, round(score))),
    }
