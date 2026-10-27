from nlp import analyze
resume = "Final year B.Tech student. Skills: Python, Django, NodeJS, MongoDB, Git. Built a REST API and used Docker."
job = "We need a backend developer to build REST APIs and services."
r = analyze(resume, job, ["Python", "Django", "Node.js", "Kubernetes", "Docker"])
print(r)
assert "django" in r["matchedSkills"] and "node.js" in r["matchedSkills"]
assert r["missingSkills"] == ["kubernetes"]
assert 0 < r["score"] <= 100
print("AI service tests passed")
