import { checkAppMembership, getCurrentUser } from "@/lib/queries";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isMember = await checkAppMembership();

  if (!isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Vraag de patron voor toegang</p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">📖 Spelregels</h1>
            </div>
          </div>
          {/* <SignOutButton /> */}
        </div>

        {/* Rules Content */}
        <div className="space-y-6 pb-8">
          {/* Doel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Doel van het spel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Het doel is om <strong>21</strong> te gooien met twee
                dobbelstenen.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>21</strong> (1 en 2) = Mexico → een half adje in de
                  pot
                </li>
                <li>
                  <strong>32</strong> is ook speciaal (de laagste combinatie)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Je schrijft combinaties als het hoogste getal eerst: 4 en 3 ={" "}
                <strong>43</strong>, 3 en 2 = <strong>32</strong>
              </p>
            </CardContent>
          </Card>

          {/* Verloop van een beurt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎲 Verloop van een beurt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Je mag <strong>maximaal 3 keer gooien</strong> per beurt
                </li>
                <li>
                  Als je <strong>21 of 32</strong> gooit, moet je{" "}
                  <strong>direct stoppen</strong>
                </li>
                <li>
                  De volgende speler mag maximaal evenveel keer gooien als jij
                  hebt gegooid
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="font-semibold mb-2">Voorbeeld:</p>
                <p className="text-sm">
                  Jij gooit 2 keer en moet stoppen → De volgende speler mag ook
                  maar 2 keer gooien
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Einde van een ronde */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔁 Einde van een ronde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Een ronde is afgelopen wanneer:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                <li>Iedereen aan de beurt is geweest</li>
                <li>En het spel terugkomt bij de speler die de ronde begon</li>
              </ul>
              <p className="mt-3">Daarna start een nieuwe ronde.</p>
            </CardContent>
          </Card>

          {/* Waardes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔢 Waardes van combinaties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Speciale combinaties:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>21</strong> → Mexico (half adje in de pot)
                  </li>
                  <li>
                    <strong>32</strong> → laagste combinatie
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">
                  Dubbele cijfers (extra sterk):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-2">
                  <div className="bg-muted/50 p-2 rounded text-center">
                    11 = <strong>100</strong>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    22 = <strong>200</strong>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    33 = <strong>300</strong>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    44 = <strong>400</strong>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    55 = <strong>500</strong>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-center">
                    66 = <strong>600</strong>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Hoe hoger, hoe beter.
              </p>
            </CardContent>
          </Card>

          {/* Dobbelsteen laten liggen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Speciale regel: Dobbelsteen laten liggen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                <strong>Je mag per beurt één 1 of één 2 laten liggen</strong>
              </p>
              <p>Dit betekent:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Je houdt die dobbelsteen vast</li>
                <li>Je gooit alleen de andere opnieuw</li>
              </ul>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="font-semibold mb-2">Voorbeeld:</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Eerste worp:</strong> 31 → 31 telt niet speciaal, je
                    mag nog eens gooien
                  </li>
                  <li>
                    <strong>Je laat de 1 liggen</strong>
                  </li>
                  <li>
                    <strong>Tweede worp:</strong> je gooit een 4 → je hebt nu{" "}
                    <strong>41</strong>
                  </li>
                  <li>
                    Je mag opnieuw de 1 laten liggen en verder gooien binnen je
                    maximum aantal worpen
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Belangrijk */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Belangrijk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Je mag maar <strong>maximaal 3 worpen</strong> doen per beurt
                </li>
                <li>
                  <strong>21 of 32</strong> betekent{" "}
                  <strong>direct stoppen</strong>
                </li>
                <li>
                  De volgende speler is beperkt door het aantal worpen dat jij
                  gebruikte
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
