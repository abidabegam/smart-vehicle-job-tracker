from django.db import models
from django.contrib.auth.models import User

STATUS_CHOICES = [
    ("APPLIED", "Applied"),
    ("INTERVIEW", "Interview"),
    ("OFFER", "Offer"),
    ("REJECTED", "Rejected"),
]

AUTOMOTIVE_TAGS = [
    ("ADAS", "ADAS"),
    ("AUTOSAR", "AUTOSAR"),
    ("HIL", "HIL"),
    ("SIL", "SIL"),
    ("SDV", "SDV"),
    ("AI", "AI/ML"),
    ("CLOUD", "Cloud"),
]

class JobApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="APPLIED")
    automotive_tag = models.CharField(max_length=20, choices=AUTOMOTIVE_TAGS, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company} - {self.role}"
