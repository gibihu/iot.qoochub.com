'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { useState } from "react"
import { toast } from "sonner"
import { LoaderCircle } from "lucide-react"
import { redirect } from "next/navigation"


export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [isFetch, setIsFetch] = useState<boolean>(false);

  const [name, setName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [passConF, setPassConF] = useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (password !== passConF) {
        toast.error('รหัสผ่านไม่ตรงกัน');
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if(res.ok){
          const data = await res.json();
          console.log("Created:", data);
          toast.success('ลงชื่อเข้าใช้สำเร็จแล้ว');
          setTimeout(()=>{
            redirect("/auth/login");
          }, 1000);
        }else{
          const data = await res.json();
          console.log(data);
          toast.error(data.message, {description: data.error})
        }
      }
    } catch (error) {
      console.error('Error:', error);
      let message = "เกิดข้อผิดพลาดบางอย่าง";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }

      toast.error(message, { className: "bg-red-500 text-white" });
    } finally {
      setIsFetch(false);
    }
  }


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center ">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name ?? ''}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email ?? ''}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password ?? ''}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={passConF ?? ''}
                      onChange={(e) => setPassConF(e.target.value)}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isFetch}>
                  {isFetch && (<LoaderCircle className="size-4 animate-spin" />)}
                  Create Account
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/auth/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our
        <Tooltip>
          <TooltipTrigger asChild><a href="#"> Terms of Service </a></TooltipTrigger>
          <TooltipContent>
            <p>500 Robux</p>
          </TooltipContent>
        </Tooltip>
        and
        <Tooltip>
          <TooltipTrigger asChild><a href="#"> Privacy Policy</a></TooltipTrigger>
          <TooltipContent>
            <p>500 Robux</p>
          </TooltipContent>
        </Tooltip>
      </FieldDescription>
    </div>
  )
}
