"""Django models for patient records."""

import uuid

from django.db import models


class PatientRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    age = models.IntegerField()
    weight_kg = models.FloatField()
    height_cm = models.FloatField()
    bmi = models.FloatField(blank=True, null=True)

    pattern_arc = models.IntegerField(default=0)
    pattern_whorl = models.IntegerField(default=0)
    pattern_loop = models.IntegerField(default=0)

    risk_score = models.FloatField()
    risk_level = models.CharField(max_length=20)

    # New Fields for Donation Feature
    blood_group = models.CharField(
        max_length=5, blank=True, null=True
    )  # e.g. "A+", "AB-"
    donation_eligibility_status = models.CharField(
        max_length=20, blank=True, null=True
    )  # e.g. "Eligible", "Ineligible"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]  # noqa: RUF012
        db_table = "patient_records"

    def save(self, *args, **kwargs):
        if not self.bmi and self.weight_kg and self.height_cm:
            height_m = self.height_cm / 100
            self.bmi = round(self.weight_kg / (height_m**2), 2)
        super().save(*args, **kwargs)

    def __str__(self):  # noqa: DJ012
        return f"Record {self.id} - Risk: {self.risk_level}"
