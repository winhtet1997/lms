"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { sessionService } from "@/service/sessionService";
import StepIndicator from "./StepIndicator";
import ChooseTutorStep from "./ChooseTutorStep";
import SelectTimeStep from "./SelectTimeStep";
import ConfirmStep from "./ConfirmStep";

export default function BookTutorPage() {
  const t = useTranslations("BookTutorPage");
  const router = useRouter();
  const { locale } = useParams();

  const [step, setStep] = useState(1);
  const [tutors, setTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [topic, setTopic] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    sessionService
      .getTutors()
      .then(setTutors)
      .catch(() => setTutors([]))
      .finally(() => setTutorsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTutor) return;
    setLoadingSlots(true);
    sessionService
      .getTutorAvailability(selectedTutor.id)
      .then(setAvailability)
      .catch(() => setAvailability([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedTutor]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!selectedTutor || !selectedSlot) return;
    setBooking(true);
    setBookingError(null);
    try {
      await sessionService.bookSession({
        tutor_id: selectedTutor.id,
        session_type: "private",
        topic,
        scheduled_at: selectedSlot.isoString,
        duration_minutes: 60,
        max_participants: 2,
      });
      router.push(`/${locale}/student/sessions`);
    } catch (e) {
      setBookingError(e?.response?.data?.detail || t("bookingFailedError"));
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-800">{t("pageTitle")}</h1>
                        <p className="text-xs text-gray-500">{t("pageSubtitle")}</p>
                    </div>
                </div> */}

        <StepIndicator step={step} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {step === 1 && (
            <ChooseTutorStep
              tutors={tutors}
              loading={tutorsLoading}
              selectedTutor={selectedTutor}
              onSelect={setSelectedTutor}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <SelectTimeStep
              tutor={selectedTutor}
              availability={availability}
              loadingSlots={loadingSlots}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onDateChange={handleDateChange}
              onSlotSelect={setSelectedSlot}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ConfirmStep
              tutor={selectedTutor}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              topic={topic}
              onTopicChange={setTopic}
              onConfirm={handleConfirm}
              onBack={() => setStep(2)}
              loading={booking}
              error={bookingError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
