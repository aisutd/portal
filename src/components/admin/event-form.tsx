"use client";

import { useState } from "react";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import type { TagData } from "@/components/dashboard/up-next-card";
import type { MembershipType, UserRole, TEAM, EventTag } from "@prisma/client";
import { PROGRAM_BADGES } from "@/lib/members/badges";
import { ASSIGNABLE_PROGRAMS, PROGRAM_LABELS, ALL_USER_ROLES, USER_ROLE_LABELS } from "@/lib/roles";

type EventItemInput = {
  name: string;
  type: "MEAL" | "DRINK" | "MERCH" | "OTHER";
};

type EventFormProps = {
  /** Selectable category tags (the colorful pills). */
  tags: TagData[];
  defaultValues?: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    capacity?: string;
    visibility?: string;
    visibilityRoles?: UserRole[];
    visibilityMembership?: MembershipType[];
    visibilityTeams?: TEAM[];
    isPublished?: boolean;
    isRsvpOpen?: boolean;
    status?: string;
    tags?: EventTag[];
    programs?: MembershipType[];
    items?: EventItemInput[];
  };
};

const ALL_TEAMS: TEAM[] = [
  "AI_ACADEMY",
  "AI_INNOVATION",
  "AIM",
  "MARKETING",
  "OPERATIONS",
  "FINANCE",
  "INDUSTRY",
  "TECHNOLOGY",
  "EXECUTIVE",
];

export function EventForm({ tags, defaultValues }: EventFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [selectedPrograms, setSelectedPrograms] = useState<MembershipType[]>(
    defaultValues?.programs ?? []
  );
  const [selectedVisibilityRoles, setSelectedVisibilityRoles] = useState<UserRole[]>(
    defaultValues?.visibilityRoles ?? ["MEMBER"]
  );
  const [selectedVisibilityMemberships, setSelectedVisibilityMemberships] = useState<MembershipType[]>(
    defaultValues?.visibilityMembership ?? []
  );
  const [selectedVisibilityTeams, setSelectedVisibilityTeams] = useState<TEAM[]>(
    defaultValues?.visibilityTeams ?? []
  );

  const [eventItems, setEventItems] = useState<EventItemInput[]>(defaultValues?.items ?? []);
  const [isPublished, setIsPublished] = useState<boolean>(defaultValues?.isPublished ?? false);
  const [isRsvpOpen, setIsRsvpOpen] = useState<boolean>(defaultValues?.isRsvpOpen ?? true);

  const toggleTag = (tag: string) => {
    setSelectedTags((current: string[]) =>
      current.includes(tag) ? current.filter((item: string) => item !== tag) : [...current, tag]
    );
  };

  const toggleProgram = (program: MembershipType) => {
    setSelectedPrograms((current: MembershipType[]) =>
      current.includes(program)
        ? current.filter((item: MembershipType) => item !== program)
        : [...current, program]
    );
  };

  const toggleVisibilityRole = (role: UserRole) => {
    setSelectedVisibilityRoles((current: UserRole[]) =>
      current.includes(role) ? current.filter((item: UserRole) => item !== role) : [...current, role]
    );
  };

  const toggleVisibilityMembership = (program: MembershipType) => {
    setSelectedVisibilityMemberships((current: MembershipType[]) =>
      current.includes(program)
        ? current.filter((item: MembershipType) => item !== program)
        : [...current, program]
    );
  };

  const toggleVisibilityTeam = (team: TEAM) => {
    setSelectedVisibilityTeams((current: TEAM[]) =>
      current.includes(team) ? current.filter((item: TEAM) => item !== team) : [...current, team]
    );
  };

  const addItem = () => {
    setEventItems((current: EventItemInput[]) => [...current, { name: "", type: "MEAL" }]);
  };

  const removeItem = (index: number) => {
    setEventItems((current: EventItemInput[]) => current.filter((_: EventItemInput, i: number) => i !== index));
  };

  const updateItem = (index: number, field: keyof EventItemInput, value: string) => {
    setEventItems((current: EventItemInput[]) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="flex min-w-px flex-1 flex-col gap-[24px] rounded-[16px] border border-border-soft bg-white p-[31px]">
      {/* Hidden Fields for Arrays & Serialized Data */}
      <input type="hidden" name="tags" value={selectedTags.join(",")} />
      <input type="hidden" name="programs" value={selectedPrograms.join(",")} />
      <input type="hidden" name="visibilityRoles" value={selectedVisibilityRoles.join(",")} />
      <input type="hidden" name="visibilityMembership" value={selectedVisibilityMemberships.join(",")} />
      <input type="hidden" name="visibilityTeams" value={selectedVisibilityTeams.join(",")} />
      <input type="hidden" name="status" value={defaultValues?.status ?? "UPCOMING"} />
      <input type="hidden" name="visibility" value={defaultValues?.visibility ?? "public"} />
      <input type="hidden" name="eventItems" value={JSON.stringify(eventItems)} />
      <input type="hidden" name="isPublished" value={String(isPublished)} />
      <input type="hidden" name="isRsvpOpen" value={String(isRsvpOpen)} />

      {/* Basic Event Information */}
      <FormField
        label="Event title"
        height={46}
        placeholder="e.g. Fall Kickoff"
        name="title"
        defaultValue={defaultValues?.title ?? ""}
        required
      />

      <FormTextarea
        label="Description"
        name="description"
        defaultValue={defaultValues?.description ?? ""}
        required
      />

      <div className="grid grid-cols-1 gap-x-[28px] gap-y-[20px] sm:grid-cols-2">
        <FormField
          label="Start time"
          placeholder="2026-09-10T19:00"
          type="datetime-local"
          name="startTime"
          defaultValue={defaultValues?.startTime ?? ""}
          required
        />
        <FormField
          label="End time"
          placeholder="2026-09-10T20:30"
          type="datetime-local"
          name="endTime"
          defaultValue={defaultValues?.endTime ?? ""}
          required
        />
        <FormField
          label="Location"
          placeholder="ECSW 1.315"
          name="location"
          defaultValue={defaultValues?.location ?? ""}
          required
        />
        <FormField
          label="Capacity"
          placeholder="150"
          inputMode="numeric"
          name="capacity"
          type="number"
          min="1"
          defaultValue={defaultValues?.capacity ?? ""}
        />
      </div>

      {/* Visibility Filters Section */}
      <div className="flex flex-col gap-4 border-t border-border-soft pt-5">
        <span className="style-body-text leading-[20.3px] text-ink font-semibold">
          Visibility & Access Restrictions
        </span>

        {/* Roles Visibility Array */}
        <div className="flex flex-col gap-2">
          <span className="style-caption text-xs text-ink-muted">
            Allowed User Roles (Default: MEMBER)
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {ALL_USER_ROLES.map((role: UserRole) => {
              const isActive = selectedVisibilityRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleVisibilityRole(role)}
                  className={`cursor-pointer rounded-full border px-[14px] py-[6px] text-xs transition-colors ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "border-border-soft bg-white text-ink-muted hover:bg-row-soft"
                  }`}
                >
                  {isActive ? "✓ " : ""}
                  {USER_ROLE_LABELS[role] || role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Membership Visibility Array */}
        <div className="flex flex-col gap-2">
          <span className="style-caption text-xs text-ink-muted">
            Restrict to Specific Memberships (Leave blank for all members)
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {ASSIGNABLE_PROGRAMS.map((program: MembershipType) => {
              const isActive = selectedVisibilityMemberships.includes(program);
              const badge = PROGRAM_BADGES[program];
              return (
                <button
                  key={`vis-mem-${program}`}
                  type="button"
                  onClick={() => toggleVisibilityMembership(program)}
                  className={`cursor-pointer rounded-full border px-[14px] py-[6px] text-xs transition-colors ${
                    isActive
                      ? "border-transparent"
                      : "border-border-soft bg-white text-ink-muted hover:bg-row-soft"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: badge?.bg ?? "#efece3", color: badge?.color ?? "#16161c" }
                      : undefined
                  }
                >
                  {isActive ? "✓ " : ""}
                  {PROGRAM_LABELS[program]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Teams Visibility Array */}
        <div className="flex flex-col gap-2">
          <span className="style-caption text-xs text-ink-muted">
            Restrict to Specific Teams (Leave blank for all teams)
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {ALL_TEAMS.map((team: TEAM) => {
              const isActive = selectedVisibilityTeams.includes(team);
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => toggleVisibilityTeam(team)}
                  className={`cursor-pointer rounded-full border px-[12px] py-[5px] text-xs transition-colors ${
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-border-soft bg-white text-ink-muted hover:bg-row-soft"
                  }`}
                >
                  {isActive ? "✓ " : ""}
                  {team}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Items / Perks Section */}
      <div className="flex flex-col gap-3 border-t border-border-soft pt-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="style-body-text leading-[20.3px] text-ink font-semibold">
              Event Items / Perks (Meals, Drinks, Merch)
            </span>
            <p className="style-caption text-xs text-ink-faint">
              Configure items that can be scanned/claimed during the event.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            + Add Item
          </Button>
        </div>

        {eventItems.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {eventItems.map((item: EventItemInput, index: number) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Pizza Slice, T-Shirt)"
                  value={item.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, "name", e.target.value)}
                  className="flex-1 rounded-lg border border-border-soft bg-white px-3 py-2 style-caption text-sm text-ink outline-none focus:border-brand"
                  required
                />
                <select
                  value={item.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateItem(index, "type", e.target.value as EventItemInput["type"])}
                  className="rounded-lg border border-border-soft bg-white px-3 py-2 style-caption text-sm text-ink outline-none focus:border-brand"
                >
                  <option value="MEAL">MEAL</option>
                  <option value="DRINK">DRINK</option>
                  <option value="MERCH">MERCH</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Program Credit Tracking ("Counts toward") */}
      <div className="flex w-full flex-col gap-[7px] border-t border-border-soft pt-5">
        <span className="style-body-text leading-[20.3px] text-ink-muted font-medium">
          Counts toward (Programs)
        </span>
        <span className="style-body-text leading-[18px] text-ink-faint">
          Leave empty for a general event that counts for every member.
        </span>
        <div className="mt-[4px] flex flex-wrap gap-[8px]">
          {ASSIGNABLE_PROGRAMS.map((program: MembershipType) => {
            const isActive = selectedPrograms.includes(program);
            const badge = PROGRAM_BADGES[program];
            return (
              <button
                key={program}
                type="button"
                onClick={() => toggleProgram(program)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-full border px-[14px] py-[7px] style-body-text transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft ${
                  isActive
                    ? "border-transparent"
                    : "border-border-soft bg-white text-ink-muted hover:bg-row-soft"
                }`}
                style={
                  isActive
                    ? { backgroundColor: badge?.bg ?? "#efece3", color: badge?.color ?? "#16161c" }
                    : undefined
                }
              >
                {isActive ? "✓ " : ""}
                {PROGRAM_LABELS[program]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      <div className="flex w-full flex-col gap-[7px] border-t border-border-soft pt-5">
        <span className="style-body-text leading-[20.3px] text-ink-muted font-medium">
          Tags
        </span>
        <div className="flex flex-wrap gap-[8px]">
          {tags.map((t: TagData) => {
            const isActive = selectedTags.includes(t.label.toUpperCase());
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => toggleTag(t.label.toUpperCase())}
                className="rounded-full"
              >
                <Tag
                  label={t.label}
                  bg={t.bg}
                  color={t.color}
                  border={t.border}
                  className={isActive ? "ring-2 ring-brand/50" : ""}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings / Toggles Section */}
      <div className="flex flex-col gap-4 border-t border-border-soft pt-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="style-body-text text-ink font-medium">Publish Immediately</span>
            <p className="style-caption text-xs text-ink-faint">
              When checked, this event will be visible to eligible users.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-5 w-5 rounded border-border-soft text-brand focus:ring-brand cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border-soft/60 pt-3">
          <div>
            <span className="style-body-text text-ink font-medium">Allow RSVPs</span>
            <p className="style-caption text-xs text-ink-faint">
              Enable or disable member RSVPs for this event.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isRsvpOpen}
            onChange={(e) => setIsRsvpOpen(e.target.checked)}
            className="h-5 w-5 rounded border-border-soft text-brand focus:ring-brand cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}