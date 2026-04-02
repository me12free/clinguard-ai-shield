# Chapter 6: Conclusion, Recommendations, and Future Work

## 6.1 Introduction

This short chapter summarises what the ClinGuard project achieved, states **recommendations** for deployment and maintenance, and suggests **future work** for researchers who might extend the same line of inquiry.

## 6.2 Conclusion

The project delivered a **working web application** that placed automated PHI detection and redaction, policy configuration, and audit logging **between** clinical users and an external generative AI API. The implementation combined a Laravel backend, a React frontend, and a Python analysis service, with a relational schema that supported multi-tenant organisations and role-based permissions. Automated tests demonstrated that API contracts and permission rules behaved as specified, and model evaluation on held-out data quantified detector performance within the limits of the training corpora.

The **problem** stated in Chapter 1, ungoverned transmission of sensitive clinical text to third-party models, was **addressed** in a practical, demonstrable way within the stated scope. The solution was intended to benefit **clinicians** (safer prompting), **security staff** (policy and logs), and the **IT community** (reusable open-stack pattern), recognising that full regulatory compliance remains an organisational responsibility beyond any single prototype.

## 6.3 Recommendations

It is recommended that any organisation adapting this system **complete a formal data protection impact assessment** and **sign appropriate agreements** with model providers before production use. **Secrets** (API keys, database credentials) should be injected via environment configuration or a vault, never committed to source control. **HTTPS** should terminate at a properly configured reverse proxy in production. **Roles** should be reviewed so that **emergency bypass** remains rare, logged, and periodically audited.

For **model quality**, it is recommended to **retrain or fine-tune** the detector as new PHI patterns or languages appear in local practice, and to **monitor** precision and recall on a validation slice over time. **Backups** of the database and **retention policies** for conversations and audit rows should align with institutional policy.

## 6.4 Future work

Future researchers or developers could extend ClinGuard in several directions: **multilingual** detection beyond the English-centred training mix; **on-device** or **edge** redaction for offline scenarios; **deeper EHR integration** through standardised interfaces; **formal verification** or **penetration testing** at hospital scale; **federated** or **differential privacy** approaches for pooled learning without raw text export; and **user-experience studies** with clinicians to measure trust and efficiency impacts. **Load and chaos testing** would strengthen claims about availability under concurrent ward usage.

Another avenue is **explainability**: richer explanations of why spans were flagged could support training and appeal processes, provided that explanations did not leak sensitive content.

## 6.5 Chapter summary

ClinGuard demonstrated that **governance-first** integration of clinical generative AI was feasible with mainstream web and ML tooling. Conclusions, recommendations, and future work above frame how the prototype could evolve toward production-grade deployment.
