# Business card → vCard export

Short-circuit for digest. Use when the input is one or more images or a PDF whose **primary content is business cards**, and the user did not give a different task.

Do this automatically. Do not wait for "make vcf" / "export contacts." Do not write a vault digest.

## Detect

Cards are primary when the photo or PDF page is a stack (or a single card) of physical contact cards — name, title, org, phone, email, address — not an article, slide, screenshot, or a card incidental in the corner of something else.

If the user gave any other instruction (analyze, transcribe, identify, digest into the vault), follow that instead.

## Do

1. Read every image / PDF page. Crop or re-read a card if type is small or handwriting is faint.
2. Extract every card. One vCard per **person**. If the same person appears on more than one card in this batch (same name, or same mobile on two orgs), **merge** into one file: all emails, phones, addresses, titles, orgs.
3. The contact is the person whose name, title, and personal email are on the card. On a staff / district-office card, that is the staffer. The elected official or principal goes in `ORG` / `NOTE`, not `FN`.
4. Include handwritten extras (phones, emails, "works for X") as additional `TEL` / `EMAIL` / `NOTE`.
5. Include printed social handles and extra websites (`X-SOCIALPROFILE` plus `URL` / labeled `itemN.URL`).
6. Write **vCard 3.0**, UTF-8, CRLF. Escape `,` `;` `\` and newlines in text values.
7. Filename: `{Last}-{First}.vcf` (ASCII hyphens; drop accents in the filename only).
8. Save under iCloud Downloads, grouped:

   `/Users/james/Library/Mobile Documents/com~apple~CloudDocs/Downloads/business-cards-YYYY-MM-DD/`

9. Do not import to Google Contacts or Outlook unless asked. Do not invent websites from email domains. Do not invent fields that are not on the card.

## Ask only when stuck

Ask for a field that cannot be read with high confidence (usually handwriting). Do **not** ask about merge vs split, handwriting, socials, staffer vs principal, or save location — those defaults above are standing.

If one field is unreadable, write every other card and come back for the missing field. Do not block the batch.

## vCard shape

```
BEGIN:VCARD
VERSION:3.0
N:Last;First;Middle;Prefix;Suffix
FN:Display Name
ORG:Organization
TITLE:Title
TEL;TYPE=CELL,VOICE:(512) 555-0100
TEL;TYPE=WORK,VOICE:(512) 555-0101
TEL;TYPE=WORK,FAX:(512) 555-0102
EMAIL;TYPE=WORK,INTERNET:name@org.example
ADR;TYPE=WORK:;;street;city;state;zip;country
URL:https://example.com
X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/handle
NOTE:optional context
CATEGORIES:Business Card,YYYY-MM-DD
END:VCARD
```

US 10-digit phones as `(XXX) XXX-XXXX`. Keep `+` international numbers as printed. `CATEGORIES` uses today's date.

## After

Reply with the folder path, the person count (and how many cards merged), and any field you still need. No vault `web-analyses/` file.
