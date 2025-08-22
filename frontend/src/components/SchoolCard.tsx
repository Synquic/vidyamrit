"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  School,
  MapPin,
  Users,
  Phone,
  Mail,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  History,
  Building,
  GraduationCap,
  FileText,
  ImageIcon,
  Activity,
  IdCard,
} from "lucide-react";

interface SchoolData {
  _id: string;
  name: string;
  address: string;
  udise_code: string;
  type: "government" | "private";
  level: "primary" | "middle";
  city: string;
  state: string;
  pinCode: string;
  establishedYear: number;
  school_admin: string;
  contact_details: Array<{
    designation: string;
    name: string;
    email: string;
    phone_no: string;
    _id: string;
  }>;
  evaluationChecklist: {
    minEligibleStudents?: {
      eligibleCount?: number;
      meetsCriteria?: boolean;
      notes?: string;
    };
    dedicatedRoom?: {
      images?: string[];
      notes?: string;
    };
    supportDocuments?: {
      documents?: { name: string; url: string }[];
    };
    infrastructureAdequacy?: {
      rating?: number;
      notes?: string;
    };
    systemOutput?: "include" | "followup" | "reject";
    status?: "active" | "inactive" | "rejected" | "followup";
    ngoHistory?: Array<{ image?: string; text?: string; date?: Date }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SchoolAdminCardsProps {
  school: SchoolData;
}

export function SchoolAdminCards({ school }: SchoolAdminCardsProps) {
  const [ngoHistoryOpen, setNgoHistoryOpen] = useState(false);
  const [addNgoOpen, setAddNgoOpen] = useState(false);
  const [newNgoText, setNewNgoText] = useState("");
  const [newNgoImage, setNewNgoImage] = useState("");
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  const [documentViewOpen, setDocumentViewOpen] = useState(false);
  const [activityViewOpen, setActivityViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<{
    image?: string;
    text?: string;
    date?: Date;
  } | null>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentFile, setNewDocumentFile] = useState("");

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "followup":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSystemOutputColor = (output?: string) => {
    switch (output) {
      case "include":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "followup":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "reject":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleAddNgoHistory = () => {
    // In a real app, this would make an API call
    console.log("Adding NGO history:", {
      text: newNgoText,
      image: newNgoImage,
    });
    setNewNgoText("");
    setNewNgoImage("");
    setAddNgoOpen(false);
  };

  const handleAddDocument = () => {
    console.log("Adding document:", {
      name: newDocumentName,
      file: newDocumentFile,
    });
    setNewDocumentName("");
    setNewDocumentFile("");
    setAddDocumentOpen(false);
  };

  const handleViewDocument = (document: { name: string; url: string }) => {
    setSelectedDocument(document);
    setDocumentViewOpen(true);
  };

  const handleViewActivity = (activity: {
    image?: string;
    text?: string;
    date?: Date;
  }) => {
    setSelectedActivity(activity);
    setActivityViewOpen(true);
  };

  return (
    <Card className="w-full max-w-none xl:max-w-7xl mx-auto border-violet-200 bg-violet-50 ">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-violet-900 flex items-center gap-2 sm:gap-3">
              <School className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">{school.name}</span>
            </CardTitle>
            <CardDescription className="text-violet-700 mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <span className="flex items-center gap-1">
                <IdCard className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">UDISE: {school.udise_code}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {school.city}, {school.state}
                </span>
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 text-left sm:text-right">
            <div className="text-xs sm:text-sm text-violet-700">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`font-semibold ${
                  school.evaluationChecklist.status === "active"
                    ? "text-green-700"
                    : school.evaluationChecklist.status === "inactive"
                    ? "text-gray-700"
                    : school.evaluationChecklist.status === "rejected"
                    ? "text-red-700"
                    : school.evaluationChecklist.status === "followup"
                    ? "text-yellow-700"
                    : "text-gray-700"
                }`}
              >
                {school.evaluationChecklist.status || "Unknown"}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-violet-700">
              <span className="font-medium">System Output:</span>{" "}
              <span
                className={`font-semibold ${
                  school.evaluationChecklist.systemOutput === "include"
                    ? "text-violet-700"
                    : school.evaluationChecklist.systemOutput === "followup"
                    ? "text-amber-700"
                    : school.evaluationChecklist.systemOutput === "reject"
                    ? "text-red-700"
                    : "text-gray-700"
                }`}
              >
                {school.evaluationChecklist.systemOutput || "Pending"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-violet-50 to-stone-50 border-violet-200 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-violet-900 flex items-center gap-2">
                <School className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                School Details & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <div className="space-y-4">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-violet-100">
                  <h4 className="font-semibold text-violet-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-violet-600">Type:</span>
                        <Badge
                          variant="secondary"
                          className="bg-violet-200 text-violet-800 text-xs"
                        >
                          {school.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-600">Level:</span>
                        <Badge
                          variant="secondary"
                          className="bg-stone-200 text-stone-800 text-xs"
                        >
                          {school.level}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-600">Established:</span>
                        <span className="text-violet-800">
                          {school.establishedYear}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-violet-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-violet-600">
                      <span>
                        Created:{" "}
                        {new Date(school.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated:{" "}
                        {new Date(school.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-3 text-sm sm:text-base">
                    School Admin
                  </h4>
                  <p className="text-sm text-indigo-700 break-words">
                    {school.school_admin}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-blue-900 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 sm:h-80 lg:h-80 pr-2">
                <div className="space-y-3">
                  {school.contact_details.map((contact) => (
                    <div
                      key={contact._id}
                      className="bg-white p-3 sm:p-4 rounded-lg border border-blue-100"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h4 className="font-medium text-blue-900 text-sm sm:text-base break-words">
                          {contact.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-xs text-blue-700 border-blue-300 self-start sm:self-center"
                        >
                          {contact.designation}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-blue-600">
                          <Mail className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="break-all text-xs sm:text-sm">
                            {contact.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">
                            {contact.phone_no}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 flex-1">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-purple-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Evaluation Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <GraduationCap className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="font-medium text-purple-900 text-xs sm:text-sm">
                            Students:
                          </span>
                          <span className="text-purple-700 text-xs sm:text-sm">
                            {school.evaluationChecklist.minEligibleStudents
                              ?.eligibleCount || "N/A"}
                          </span>
                        </div>
                        {school.evaluationChecklist.minEligibleStudents
                          ?.meetsCriteria ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Building className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="font-medium text-purple-900 text-xs sm:text-sm">
                            Infrastructure:
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <=
                                  (school.evaluationChecklist
                                    .infrastructureAdequacy?.rating || 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-purple-700 flex-shrink-0">
                          {school.evaluationChecklist.infrastructureAdequacy
                            ?.rating || 0}
                          /5
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ImageIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="font-medium text-purple-900 text-xs sm:text-sm">
                            Room Images:
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-purple-700 flex-shrink-0">
                          {school.evaluationChecklist.dedicatedRoom?.images
                            ?.length || 0}{" "}
                          uploaded
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 relative">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base text-emerald-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  Support Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea>
                  <div className="space-y-2">
                    {school.evaluationChecklist.supportDocuments?.documents
                      ?.length ? (
                      school.evaluationChecklist.supportDocuments.documents.map(
                        (doc, index) => (
                          <div
                            key={index}
                            onClick={() => handleViewDocument(doc)}
                            className="bg-white p-2 rounded border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-emerald-800 truncate">
                                {doc.name}
                              </span>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-4 text-emerald-600">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No documents uploaded</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <Button
                  size="sm"
                  onClick={() => setAddDocumentOpen(true)}
                  className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Dialog open={ngoHistoryOpen} onOpenChange={setNgoHistoryOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg text-sm sm:text-base"
              >
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">View & Add Activities</span>
                <span className="sm:hidden">Activities</span>
                <span className="ml-1">
                  ({school.evaluationChecklist.ngoHistory?.length || 0})
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] sm:max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  NGO Activities & History
                </DialogTitle>
                <DialogDescription className="text-sm">
                  View all NGO partnerships and activities, or add new entries
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-end mb-4">
                <Dialog open={addNgoOpen} onOpenChange={setAddNgoOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base px-3 sm:px-4">
                      <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">Add New Activity</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">
                        Add NGO Activity
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Add a new entry to the NGO activities timeline
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 sm:space-y-6 py-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="ngo-text"
                          className="text-sm font-medium text-gray-700"
                        >
                          Activity Description *
                        </Label>
                        <Textarea
                          id="ngo-text"
                          placeholder="Describe the NGO activity, partnership details, milestones achieved, or any significant events..."
                          value={newNgoText}
                          onChange={(e) => setNewNgoText(e.target.value)}
                          className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="ngo-image"
                          className="text-sm font-medium text-gray-700"
                        >
                          Image URL (optional)
                        </Label>
                        <Input
                          id="ngo-image"
                          placeholder="https://example.com/image.jpg"
                          value={newNgoImage}
                          onChange={(e) => setNewNgoImage(e.target.value)}
                          className="h-9 sm:h-10 text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          Add an image URL to make the activity more visual
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setAddNgoOpen(false)}
                          className="px-4 sm:px-6 text-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddNgoHistory}
                          disabled={!newNgoText.trim()}
                          className="px-4 sm:px-6 bg-indigo-600 hover:bg-indigo-700 text-sm"
                        >
                          Add Activity
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[50vh] sm:h-[400px]">
                <div className="space-y-4 pr-2 sm:pr-4">
                  {school.evaluationChecklist.ngoHistory?.length ? (
                    school.evaluationChecklist.ngoHistory.map(
                      (entry, index) => (
                        <div
                          key={index}
                          onClick={() => handleViewActivity(entry)}
                          className="border border-indigo-100 rounded-lg p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                            {entry.image && (
                              <img
                                src={entry.image || "/placeholder.svg"}
                                alt="NGO activity"
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0 self-center sm:self-start"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-indigo-900 mb-2 leading-relaxed break-words">
                                {entry.text}
                              </p>
                              <p className="text-xs text-indigo-600 flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                {entry.date
                                  ? new Date(entry.date).toLocaleDateString()
                                  : "No date"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-indigo-600">
                      <History className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium mb-2">
                        No Activities Yet
                      </p>
                      <p className="text-sm">
                        Start by adding the first NGO activity or partnership
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={addDocumentOpen} onOpenChange={setAddDocumentOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Add Support Document
              </DialogTitle>
              <DialogDescription className="text-sm">
                Upload a new support document for this school
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="doc-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Document Name *
                </Label>
                <Input
                  id="doc-name"
                  placeholder="e.g., School Registration Certificate"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="doc-file"
                  className="text-sm font-medium text-gray-700"
                >
                  File URL *
                </Label>
                <Input
                  id="doc-file"
                  placeholder="https://example.com/document.pdf"
                  value={newDocumentFile}
                  onChange={(e) => setNewDocumentFile(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
                <p className="text-xs text-gray-500">
                  Provide a URL to the document file
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setAddDocumentOpen(false)}
                  className="px-4 sm:px-6 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDocument}
                  disabled={!newDocumentName.trim() || !newDocumentFile.trim()}
                  className="px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-700 text-sm"
                >
                  Add Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={documentViewOpen} onOpenChange={setDocumentViewOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                {selectedDocument?.name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Support document details
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedDocument && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Document URL:</p>
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                    >
                      {selectedDocument.url}
                    </a>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        window.open(selectedDocument.url, "_blank")
                      }
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Open Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={activityViewOpen} onOpenChange={setActivityViewOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                NGO Activity Details
              </DialogTitle>
              <DialogDescription className="text-sm">
                Full activity information
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedActivity && (
                <div className="space-y-4">
                  {selectedActivity.image && (
                    <div className="flex justify-center">
                      <img
                        src={selectedActivity.image || "/placeholder.svg"}
                        alt="Activity"
                        className="max-w-full h-auto max-h-64 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-indigo-900 leading-relaxed">
                      {selectedActivity.text}
                    </p>
                  </div>
                  {selectedActivity.date && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(selectedActivity.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
