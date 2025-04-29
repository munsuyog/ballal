"use client"

import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Card } from "./card"
import { Search, Star, X } from "lucide-react"

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface FilterSection {
  id: string
  title: string
  type: "search" | "checkbox" | "radio" | "rating"
  options?: FilterOption[]
  searchPlaceholder?: string
}

interface FilterSidebarProps {
  sections: FilterSection[]
  selectedFilters: Record<string, string[]>
  onFilterChange: (sectionId: string, values: string[]) => void
  onClearAll: () => void
}

export function FilterSidebar({
  sections,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: FilterSidebarProps) {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({})

  const handleSearchChange = (sectionId: string, value: string) => {
    setSearchValues(prev => ({ ...prev, [sectionId]: value }))
  }

  const handleCheckboxChange = (sectionId: string, optionId: string) => {
    const currentSelected = selectedFilters[sectionId] || []
    const newSelected = currentSelected.includes(optionId)
      ? currentSelected.filter(id => id !== optionId)
      : [...currentSelected, optionId]
    onFilterChange(sectionId, newSelected)
  }

  const handleRatingClick = (sectionId: string, rating: number) => {
    onFilterChange(sectionId, [rating.toString()])
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filter By</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-primary"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <h4 className="font-medium">{section.title}</h4>

            {section.type === "search" && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={section.searchPlaceholder}
                  value={searchValues[section.id] || ""}
                  onChange={(e) => handleSearchChange(section.id, e.target.value)}
                  className="pl-8"
                />
              </div>
            )}

            {section.type === "checkbox" && section.options && (
              <div className="space-y-2">
                {section.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFilters[section.id]?.includes(option.id)}
                      onChange={() => handleCheckboxChange(section.id, option.id)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        {option.count}
                      </span>
                    )}
                  </label>
                ))}
                {section.options.length > 5 && (
                  <Button variant="link" size="sm" className="text-primary">
                    See More
                  </Button>
                )}
              </div>
            )}

            {section.type === "rating" && (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start ${
                      selectedFilters[section.id]?.includes(rating.toString())
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                    onClick={() => handleRatingClick(section.id, rating)}
                  >
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="ml-2">& Up</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(selectedFilters).length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-2">Applied Filters</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([sectionId, values]) =>
              values.map((value) => {
                const section = sections.find((s) => s.id === sectionId)
                const option = section?.options?.find((o) => o.id === value)
                return (
                  <Button
                    key={`${sectionId}-${value}`}
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleCheckboxChange(sectionId, value)}
                  >
                    {option?.label || value}
                    <X className="h-3 w-3" />
                  </Button>
                )
              })
            )}
          </div>
        </div>
      )}
    </Card>
  )
}