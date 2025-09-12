import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your personal information and account details" />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">First Name</Label>

                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.name || ''}
                                            name="name"
                                            required
                                            autoComplete="given-name"
                                            placeholder="First name"
                                        />

                                        <InputError className="mt-2" message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="surname">Last Name</Label>

                                        <Input
                                            id="surname"
                                            className="mt-1 block w-full"
                                            defaultValue={(auth.user as any).surname || ''}
                                            name="surname"
                                            required
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                        />

                                        <InputError className="mt-2" message={errors.surname} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="id_number">ID Number</Label>

                                        <Input
                                            id="id_number"
                                            className="mt-1 block w-full"
                                            defaultValue={(auth.user as any).id_number || ''}
                                            name="id_number"
                                            required
                                            placeholder="National ID number"
                                        />

                                        <InputError className="mt-2" message={errors.id_number} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone_no">Phone Number</Label>

                                        <Input
                                            id="phone_no"
                                            type="tel"
                                            className="mt-1 block w-full"
                                            defaultValue={(auth.user as any).phone_no || ''}
                                            name="phone_no"
                                            required
                                            autoComplete="tel"
                                            placeholder="+355 69 123 4567"
                                        />

                                        <InputError className="mt-2" message={errors.phone_no} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.email || ''}
                                            name="email"
                                            required
                                            autoComplete="email"
                                            placeholder="Email address"
                                        />

                                        <InputError className="mt-2" message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="nipt">NIPT (Optional)</Label>

                                        <Input
                                            id="nipt"
                                            className="mt-1 block w-full"
                                            defaultValue={(auth.user as any).nipt || ''}
                                            name="nipt"
                                            placeholder="Business NIPT number"
                                        />

                                        <InputError className="mt-2" message={errors.nipt} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="balance">Account Balance (€)</Label>
                                    <Input
                                        id="balance"
                                        type="text"
                                        className="mt-1 block w-full bg-muted/50"
                                        value={`€${Number((auth.user as any).balance || 0).toFixed(2)}`}
                                        readOnly
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground">Your current account balance</p>
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the verification email.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
