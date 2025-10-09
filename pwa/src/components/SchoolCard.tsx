"use client";

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
  School,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  IdCard,
  Building,
} from "lucide-react";

interface SchoolData {
  _id: string;
  name: string;
  type: "government" | "private";
  udise_code: string;
  address: string;
  level: "primary" | "middle";
  city: string;
  state: string;
  establishedYear: number;
  pinCode: string;
  principalName: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SchoolAdminCardsProps {
  schools: SchoolData[];
  onEdit: (school: SchoolData) => void;
  onDelete: (school: SchoolData) => void;
}

export function SchoolAdminCards({
  schools,
  onEdit,
  onDelete,
}: SchoolAdminCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schools.map((school) => (
        <Card key={school._id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="h-5 w-5" />
                {school.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    school.type === "government" ? "default" : "secondary"
                  }
                >
                  {school.type}
                </Badge>
                <Badge variant="outline">{school.level}</Badge>
              </div>
            </div>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {school.address}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">UDISE:</span>
                  <span className="font-medium">{school.udise_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Est:</span>
                  <span className="font-medium">{school.establishedYear}</span>
                </div>
              </div>

              {/* Location */}
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>
                    {school.city}, {school.state} - {school.pinCode}
                  </span>
                </div>
              </div>

              {/* Principal Info */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Principal:</span>
                  <span className="font-medium">{school.principalName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{school.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{school.email}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(school)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(school)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
