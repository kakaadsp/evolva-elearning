"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import ManageStudentsModal from "./ManageStudentsModal";

interface AddStudentsProps {
  classId: string;
  classNameText?: string;
  buttonText?: string;
  buttonVariant?: "primary" | "secondary" | "ghost";
  className?: string;
  showIcon?: boolean;
  onUpdated?: (count: number) => void;
}

export default function AddStudents({
  classId,
  classNameText,
  buttonText = "Kelola Siswa",
  buttonVariant = "secondary",
  className = "w-full justify-center text-xs",
  showIcon = true,
  onUpdated,
}: AddStudentsProps) {
  const [open, setOpen] = useState(false);

  const getButtonClass = () => {
    switch (buttonVariant) {
      case "primary":
        return `btn-primary ${className}`;
      case "ghost":
        return `btn-ghost ${className}`;
      case "secondary":
      default:
        return `btn-secondary ${className}`;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={getButtonClass()}
      >
        {showIcon && <UserPlus className="w-3.5 h-3.5" />}
        {buttonText}
      </button>

      <ManageStudentsModal
        classId={classId}
        classNameText={classNameText}
        isOpen={open}
        onClose={() => setOpen(false)}
        onUpdated={onUpdated}
      />
    </>
  );
}
