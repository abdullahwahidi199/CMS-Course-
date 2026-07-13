from django.urls import path

from . import public_views


urlpatterns = [
    path("sites/<slug:tenant_slug>/sitemap.xml", public_views.public_site_sitemap, name="public-site-sitemap"),
    path("sites/<slug:tenant_slug>/robots.txt", public_views.public_site_robots, name="public-site-robots"),
    path("sites/<slug:tenant_slug>/", public_views.public_site_home, name="public-site-home"),
    path("sites/<slug:tenant_slug>/about/", public_views.public_site_about, name="public-site-about"),
    path("sites/<slug:tenant_slug>/courses/", public_views.public_site_courses, name="public-site-courses"),
    path("sites/<slug:tenant_slug>/announcements/", public_views.public_site_announcements, name="public-site-announcements"),
    path("sites/<slug:tenant_slug>/announcements/<slug:post_slug>/", public_views.public_site_announcement_detail, name="public-site-announcement-detail"),
    path("sites/<slug:tenant_slug>/announcements/<slug:post_slug>/comments/", public_views.public_site_announcement_comments, name="public-site-announcement-comments"),
    path("sites/<slug:tenant_slug>/events/", public_views.public_site_events, name="public-site-events"),
    path("sites/<slug:tenant_slug>/events/<slug:event_slug>/", public_views.public_site_event_detail, name="public-site-event-detail"),
    path("sites/<slug:tenant_slug>/achievements/", public_views.public_site_achievements, name="public-site-achievements"),
    path("sites/<slug:tenant_slug>/contact/", public_views.public_site_contact, name="public-site-contact"),
    path("sites/<slug:tenant_slug>/inquiries/", public_views.public_site_inquiries, name="public-site-inquiries"),
]
