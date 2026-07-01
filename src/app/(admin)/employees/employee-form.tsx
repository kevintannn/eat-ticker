"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createEmployee, updateEmployee } from "@/server/actions";
import { employeeSchema, type EmployeeInput, type EmployeeValues } from "@/lib/validators";
import { EMPLOYEE_CATEGORIES } from "@/lib/constants";
import type { EmployeeDTO } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeeFormProps {
  employee?: EmployeeDTO;
  trigger: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmployeeForm({ employee, trigger, open, onOpenChange }: EmployeeFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const isEdit = Boolean(employee);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput, unknown, EmployeeValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      department: "",
      category: "Staff",
      priority: 50,
      active: true,
    },
  });

  // Reset the form whenever the dialog opens (with the right values for edit vs create).
  useEffect(() => {
    if (isOpen) {
      reset({
        name: employee?.name ?? "",
        department: employee?.department ?? "",
        category: employee?.category ?? "Staff",
        priority: employee?.priority ?? 50,
        active: employee?.active ?? true,
      });
    }
  }, [isOpen, employee, reset]);

  async function onSubmit(values: EmployeeValues) {
    const result = isEdit
      ? await updateEmployee(employee!.id, values)
      : await createEmployee(values);

    if (result.ok) {
      toast.success(isEdit ? "Employee updated" : "Employee created");
      setOpen(false);
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit employee" : "New employee"}</DialogTitle>
            <DialogDescription>
              Lower priority number = higher seating priority (e.g. Boss = 1).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Jane Doe" {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (optional)</Label>
            <Input id="department" placeholder="Operations" {...register("department")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min={1} {...register("priority")} />
              {errors.priority ? (
                <p className="text-xs text-destructive">{errors.priority.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">Inactive staff are hidden from meals.</p>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
