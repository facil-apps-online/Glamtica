import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MapPin, Phone, Mail } from "lucide-react";
import { Branch } from "@/hooks/useBranches"; // Assuming Branch type is exported from here
import { useTranslation } from "@/hooks/useTranslations";
import { ScreenSize } from "@/hooks/useScreenSize"; // Importar el tipo ScreenSize

interface BranchCardProps {
  branch: Branch;
  onSuccess: () => void;
  tenantId: string;
  screenSize?: ScreenSize; // Nueva prop
}

export const BranchCard: React.FC<BranchCardProps> = ({
  branch,
  onSuccess,
  tenantId,
  screenSize, // Usar la nueva prop
}) => {
  const { t } = useTranslation();
  console.log('BranchCard - branch:', branch, 'screenSize:', screenSize); // Console log para depuración

  return (
    <Card className={`backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${screenSize === 'mobile' ? 'border-red-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {branch.name}
            {branch.is_main_branch && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({t("branches.main")})
              </span>
            )}
          </CardTitle>
          {/* DropdownMenu for actions could be added here if needed, similar to ClientCard */}
        </div>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          {branch.physical_address_line1 || branch.address || t("common.not_available")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {branch.contact_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-500" />
            <span>{branch.contact_phone}</span>
          </div>
        )}
        {branch.commercial_email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-500" />
            <span>{branch.commercial_email}</span>
          </div>
        )}
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteRequest(branch)}
            disabled={branch.is_main_branch}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};