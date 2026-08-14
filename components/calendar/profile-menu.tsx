"use client"

import { toast } from "sonner"

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Open profile menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white shadow-md outline-none ring-offset-2 focus:ring-2 focus:ring-white">U</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel><span className="block">Guest</span><span className="font-normal text-muted-foreground">Calendar is local to this device</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <button onClick={() => toast.info("Google sign-in is coming soon.")} className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent focus:bg-accent">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold text-[#4285F4] shadow-sm">G</span>
          Sign in with Google
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
