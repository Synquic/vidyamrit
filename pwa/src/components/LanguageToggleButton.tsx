import React from "react";
import { useTranslation } from "react-i18next";
import { LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LanguageToggleButtonProps {
  className?: string;
}

export const LanguageToggleButton: React.FC<LanguageToggleButtonProps> = ({
  className = "",
}) => {
  const { i18n } = useTranslation();
  const handleLanguageChange = () => {
    i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");
  };
  return (
    <Button
      type="button"
      variant={"outline"}
      size={"sm"}
      className={`flex items-center gap-1 ${className}`}
      onClick={handleLanguageChange}
    >
      <LanguagesIcon className="inline-block w-4 h-4" />
      {i18n.language === "en" ? "हिंदी" : "English"}
    </Button>
  );
};
